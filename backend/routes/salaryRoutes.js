import express from 'express';
import Salary from '../models/Salary.js';
import Payslip from '../models/Payslip.js';
import Employee from '../models/Employee.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendPayslipEmail } from '../services/emailService.js';
import PDFDocument from 'pdfkit';
import numberToWords from 'number-to-words';
import axios from "axios";
import path from "path";
import fs from 'fs';

const router = express.Router();

// Get all employees for dropdown
router.get('/employees', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const employees = await Employee.find().select('employeeId name email designation department basicSalary');
    res.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error while fetching employees' });
  }
});

// Get employee details by ID
router.get('/employee/:employeeId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error while fetching employee' });
  }
});

// Create salary record - FIXED VERSION
// Create salary record - UPDATED VERSION WITH AUTOMATIC LEAVES CARRY-FORWARD
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    console.log('📝 Creating salary record with data:', JSON.stringify(req.body, null, 2));

    const { 
      employeeId, 
      month, 
      year, 
      basicSalary,
      paidDays, 
      lopDays, 
      remainingLeaves, 
      leaveTaken, 
      earnings = [], 
      deductions = [],
    } = req.body;

    // Validate required fields
    if (!employeeId || !month || !year) {
      return res.status(400).json({ 
        message: 'Missing required fields: employeeId, month, year are required' 
      });
    }

    // Validate basicSalary
    if (!basicSalary || isNaN(basicSalary) || basicSalary <= 0) {
      return res.status(400).json({ 
        message: 'Valid basicSalary is required and must be greater than 0' 
      });
    }

    // Check if salary already exists for this employee for the same month and year
    const existingSalary = await Salary.findOne({ 
      employeeId, 
      month, 
      year,
      activeStatus: 'enabled'
    });
    
    if (existingSalary) {
      return res.status(400).json({ 
        message: `Salary record already exists for ${employeeId} for ${month} ${year}` 
      });
    }

    // Get employee details
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // 🔄 AUTOMATIC LEAVES CARRY-FORWARD LOGIC
    let calculatedRemainingLeaves = parseInt(remainingLeaves) || 0;
    
    // If remainingLeaves is not provided or is 0, calculate from previous month
    if (!remainingLeaves || remainingLeaves === 0) {
      try {
        // Get all previous salaries for this employee, sorted by year and month
        const previousSalaries = await Salary.find({ 
          employeeId,
          activeStatus: 'enabled'
        }).sort({ year: -1, month: -1 });
        
        if (previousSalaries.length > 0) {
          // Get the most recent previous salary
          const latestSalary = previousSalaries[0];
          
          // Calculate new remaining leaves: previous remaining - previous leave taken
          const previousRemaining = latestSalary.remainingLeaves || 0;
          const previousLeaveTaken = latestSalary.leaveTaken || 0;
          calculatedRemainingLeaves = Math.max(0, previousRemaining - previousLeaveTaken);
          
          console.log('🔄 Automatic leaves calculation:', {
            previousRemaining,
            previousLeaveTaken,
            calculatedRemainingLeaves
          });
        } else {
          // First salary record for this employee - use default or provided value
          calculatedRemainingLeaves = parseInt(remainingLeaves) || 0;
          console.log('📝 First salary record, using default remaining leaves:', calculatedRemainingLeaves);
        }
      } catch (error) {
        console.error('❌ Error calculating previous leaves:', error);
        // Fallback to provided value
        calculatedRemainingLeaves = parseInt(remainingLeaves) || 0;
      }
    }

    // Prepare salary data with proper validation
    const salaryData = {
      employeeId,
      name: employee.name,
      email: employee.email,
      designation: employee.designation,
      month: month,
      year: parseInt(year),
      basicSalary: parseFloat(basicSalary),
      paidDays: parseInt(paidDays) || 30,
      lopDays: parseInt(lopDays) || 0,
      remainingLeaves: calculatedRemainingLeaves, // Use calculated value
      leaveTaken: parseInt(leaveTaken) || 0,
      earnings: Array.isArray(earnings) ? earnings.map(earning => ({
        type: earning.type || 'Additional Earning',
        amount: parseFloat(earning.amount) || 0,
        percentage: parseFloat(earning.percentage) || 0,
        calculationType: earning.calculationType || 'amount'
      })) : [],
      deductions: Array.isArray(deductions) ? deductions.map(deduction => ({
        type: deduction.type || 'Deduction',
        amount: parseFloat(deduction.amount) || 0,
        percentage: parseFloat(deduction.percentage) || 0,
        calculationType: deduction.calculationType || 'amount'
      })) : [],
      activeStatus: 'enabled',
      status: 'draft'
    };

    console.log('✅ Processed salary data with automatic leaves:', JSON.stringify(salaryData, null, 2));

    // Create and save salary record
    const salary = new Salary(salaryData);
    
    // Validate before saving
    const validationError = salary.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationError.errors 
      });
    }

    await salary.save();
    console.log('✅ Salary record created successfully with automatic leaves carry-forward:', salary._id);

    res.status(201).json({
      message: 'Salary record created successfully with automatic leaves carry-forward',
      salary: salary.toObject()
    });

  } catch (error) {
    console.error('❌ Error creating salary:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate salary record found for this employee and period' 
      });
    }

    res.status(500).json({ 
      message: 'Server error while creating salary record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all salary records
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salaries = await Salary.find().sort({ createdAt: -1 });
    res.json({ salaries });
  } catch (error) {
    console.error('Error fetching salaries:', error);
    res.status(500).json({ message: 'Server error while fetching salaries' });
  }
});

// Get salary records for an employee
router.get('/employee/:employeeId/salaries', authenticateToken, async (req, res) => {
  try {
    const salaries = await Salary.find({ 
      employeeId: req.params.employeeId 
    }).sort({ year: -1, month: -1 });
    
    res.json({ salaries });
  } catch (error) {
    console.error('Error fetching employee salaries:', error);
    res.status(500).json({ message: 'Server error while fetching employee salaries' });
  }
});

// Get active salary records for an employee
router.get('/employee/:employeeId/active', authenticateToken, async (req, res) => {
  try {
    const salary = await Salary.findOne({ 
      employeeId: req.params.employeeId,
      activeStatus: 'enabled'
    });
    
    if (!salary) {
      return res.status(404).json({ message: 'No active salary record found for this employee' });
    }
    
    res.json({ salary });
  } catch (error) {
    console.error('Error fetching active salary:', error);
    res.status(500).json({ message: 'Server error while fetching active salary' });
  }
});

// Get disabled salary records
router.get('/disabled', authenticateToken, async (req, res) => {
  try {
    const disabledSalaries = await Salary.find(
  { 
                $or :[ 
      { activeStatus: 'cancelled' },
      { activeStatus: 'disabled' }]}
    );
    res.json({ salaries: disabledSalaries });
  } catch (error) {
    console.error('Error fetching disabled salaries:', error);
    res.status(500).json({ message: 'Server error while fetching disabled salaries' });
  }
});

// Get salary by ID
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    res.json({ salary });
  } catch (error) {
    console.error('Error fetching salary:', error);
    res.status(500).json({ message: 'Server error while fetching salary' });
  }
});

// Update salary record
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    res.json({ 
      message: 'Salary record updated successfully', 
      salary 
    });
  } catch (error) {
    console.error('Error updating salary:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Server error while updating salary' });
  }
});

// Delete salary record
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }
    
    // Also delete associated payslips
    await Payslip.deleteMany({ salaryId: req.params.id });
    
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary:', error);
    res.status(500).json({ message: 'Server error while deleting salary' });
  }
});

// Apply hike to salary record
router.post('/:id/apply-hike', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { startDate, hikePercent } = req.body;

    if (!startDate || !hikePercent) {
      return res.status(400).json({ message: 'Start date and hike percentage are required' });
    }

    if (hikePercent <= 0 || hikePercent > 100) {
      return res.status(400).json({ message: 'Hike percentage must be between 1 and 100' });
    }

    const result = await Salary.applyHike(req.params.id, {
      startDate: new Date(startDate),
      hikePercent: parseFloat(hikePercent)
    });

    res.json({
      message: `Hike of ${hikePercent}% applied successfully. New salary record will be activated on ${startDate}`,
      currentSalary: result.currentSalary,
      newSalary: result.newSalary
    });
  } catch (error) {
    console.error('Error applying hike:', error);
    res.status(500).json({ message: error.message || 'Server error while applying hike' });
  }
});

// Generate payslip and send email
router.post('/:id/generate-payslip', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // 🔒 Check if salary is active
    if (salary.activeStatus !== 'enabled') {
      return res.status(400).json({
        message: 'Payslip cannot be generated for disabled salary records.'
      });
    }

    // Check if payslip already exists
      const existingPayslip = await Payslip.findOne({ 
      employeeId: salary.employeeId, 
      month: salary.month,
      year: salary.year
    });

       if (existingPayslip) {
      return res.status(400).json({ 
        message: `Payslip already generated for ${salary.month} ${salary.year}` 
      });
    }

    // Create payslip record
    const payslipData = {
      salaryId: salary._id,
      employeeId: salary.employeeId,
      name: salary.name,
      email: salary.email,
      designation: salary.designation,
      panNo : salary.panNo,
      month: salary.month,
      year: salary.year,
      payDate: new Date().toISOString().split('T')[0],
      basicSalary: salary.basicSalary,
      grossEarnings: salary.grossEarnings,
      totalDeductions: salary.totalDeductions,
      netPay: salary.netPay,
      paidDays: salary.paidDays,
      lopDays: salary.lopDays,
      remainingLeaves: salary.remainingLeaves,
      leaveTaken: salary.leaveTaken,
      earnings: salary.earnings,
      deductions: salary.deductions
    };

    const payslip = new Payslip(payslipData);
    await payslip.save();

    // Update salary status to paid
    salary.status = 'paid';
    await salary.save();

    // Send email with payslip
    const emailResult = await sendPayslipEmail(payslip);

    res.json({
      message: 'Payslip generated and sent successfully',
      payslip,
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Error generating payslip:', error);
    res.status(500).json({ message: 'Server error while generating payslip' });
  }
});

// Get payslips for an employee
router.get('/payslips/:employeeId', authenticateToken, async (req, res) => {
  try {
    // Step 1: Find all enabled salary records for this employee
    const activeSalaries = await Salary.find({
      employeeId: req.params.employeeId,
      activeStatus: 'enabled'
    }).select('_id');

    if (activeSalaries.length === 0) {
      return res.json({ payslips: [] });
    }

    // Step 2: Extract all active salary IDs
    const activeSalaryIds = activeSalaries.map(s => s._id);

    // Step 3: Find payslips linked to those salary IDs
    const payslips = await Payslip.find({
      employeeId: req.params.employeeId,
      salaryId: { $in: activeSalaryIds }
    }).sort({ createdAt: -1 });

    res.json({ payslips });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ message: 'Server error while fetching payslips' });
  }
});

router.get('/payslip/:id/download', authenticateToken, async (req, res) => {
    try {
    const payslip = await Payslip.findById(req.params.id).lean();
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    // Check if the related salary record is active (enabled)
    const salary = await Salary.findById(payslip.salaryId).lean();
    if (!salary || salary.activeStatus !== 'enabled') {
      return res.status(403).json({
        message: 'Payslip cannot be downloaded because the salary record is not active',
      });
    }


    // Create PDF
    const doc = new PDFDocument();
    const filename = `payslip-${payslip.employeeId}-${payslip.month}-${payslip.year}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    doc.pipe(res);
    
    // PDF content
    const logoUrl = "https://res.cloudinary.com/dmeixikaj/image/upload/v1762321093/logo_nrmc3t.png";
    const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
    const logoBuffer = Buffer.from(logoResponse.data, "utf-8");

    // ✅ Add logo from buffer
    doc.image(logoBuffer, 50, 40, { width: 50 });
    doc.fontSize(18).fillColor("#000").text("Zynith IT Solutions", 100, 45);
    doc.fontSize(10).fillColor("gray").text("Chennai, India", 100, 65);
    doc.fontSize(15).fillColor("gray").text("Payslip For the Month", 380, 47);
    doc.fontSize(12).text(`${payslip.month}`, 475, 75);

    doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#ccc").stroke();

    doc.fontSize(12).fillColor("black").text("EMPLOYEE SUMMARY", 50, 130);

    doc.fontSize(11).fillColor("gray").text("Employee Name", 50, 150);
    doc.text(":", 138, 150);
    doc.fontSize(11).fillColor("black").text(payslip.name, 150, 150);

    doc.fontSize(11).fillColor("gray").text("Employee ID", 50, 170);
    doc.text(":", 138, 170);
    doc.fontSize(11).fillColor("black").text(payslip.employeeId, 150, 170);

    doc.fontSize(11).fillColor("gray").text("Designation", 50, 190);
    doc.text(":", 138, 190);
    doc.fontSize(11).fillColor("black").text(payslip.designation, 150, 190);

    doc.fontSize(11).fillColor("gray").text("Pay Period", 50, 210);
    doc.text(":", 138, 210);
    doc.fontSize(11).fillColor("black").text(payslip.month, 150, 210);

    doc.fontSize(11).fillColor("gray").text("Pay Date", 50, 230);
    doc.text(":", 138, 230);
    doc.fontSize(11).fillColor("black").text(`${(payslip.payDate).toLocaleDateString("en-GB")}`,150, 230);

    doc.fontSize(11).fillColor("gray").text("Pan No", 50, 250);
    doc.text(":", 138, 250);
    doc.fontSize(11).fillColor("black").text(payslip.panNo, 150, 250);
    

    const boxX = 350;
    const boxY = 130;
    const boxWidth = 200;
    const boxHeight = 120;
    const radius = 10;

    doc.save();
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight-65, radius)
    .fillOpacity(1)   // solid
    .fillAndStroke("#f2fef6", "#cccccc"); // very light green + grey border
    doc.restore();

    doc.save();
    doc.roundedRect(boxX, boxY+68, boxWidth, boxHeight-65, radius)
    .fillOpacity(1)   // solid
    .fillAndStroke("#e6f3ff", "#cccccc"); // very light green + grey border
    doc.restore();
    
    // ✅ Bold Green Monthly CTC
    doc.fontSize(18).fillColor("#0a9f49").font("Helvetica-Bold")
    .text("Rs.", boxX+15, boxY+15);
    doc.text(payslip.netPay.toFixed(2), boxX + 46, boxY + 15); // 

    doc.fontSize(11).fillColor("gray").font("Helvetica")
    .text("Gross Earnings - Total Deductions", boxX+15, boxY + 32);

    // Paid Days / LOP Days
    doc.fontSize(11).fillColor("black").text("Paid Days :", boxX +20, boxY + 80);
    doc.text(payslip.paidDays, boxX + 120, boxY + 80);

    doc.text("LOP Days :", boxX + 20, boxY + 100);
    doc.text(payslip.lopDays, boxX + 120, boxY + 100);

    doc.moveTo(50, 283).lineTo(550, 283).strokeColor("#ccc").stroke();

    doc.moveDown(2);

    doc.fontSize(11).fillColor("gray").text("Remaining Leave", 50, 293);
    doc.text(":", 138, 293);
    doc.fontSize(11).fillColor("black").text(payslip.remainingLeaves, 150, 293);

    doc.fontSize(11).fillColor("gray").text("Leaves Taken", 290, 293);
    doc.text(":", 378, 293);
    doc.fontSize(11).fillColor("black").text(payslip.leaveTaken, 390, 293);

    const tableX = 50;
    const tableY = 310;
    const tableWidth = 500;
    const tableHeight = 130;

    doc.save();
    doc.roundedRect(tableX, tableY, tableWidth, tableHeight+20, radius)
    .fillAndStroke("#ffffff","#cccccc"); // very light green + grey border
    doc.restore();

    // Table Headers
    doc.fontSize(11).font("Helvetica-Bold").fillColor("black");

    doc.text("EARNINGS", tableX + 20, tableY + 10);
    doc.text("AMOUNT", tableX + 170, tableY + 10);

    doc.text("DEDUCTIONS", tableX + 270, tableY + 10);
    doc.text("AMOUNT", tableX + 430, tableY + 10);

    doc.moveTo(tableX + 20, tableY + 28)
    .lineTo(270, tableY + 28)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    doc.moveTo(320, tableY + 28)
    .lineTo(530, tableY + 28)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    // Reset font
    doc.fontSize(11).font("Helvetica").fillColor("black");

    let y = tableY + 50;
    payslip.earnings.forEach(e => {
        doc.text(`${e.type}`, tableX + 20, y);
        doc.text(`Rs . ${e.amount.toFixed(2)}`, tableX + 140, y, { align:"right", width: 80 });
        doc.font("Helvetica");
        y += 20;
    });

    doc.font("Helvetica");

    // Deductions Loop (separate y2, same alignment as before)
    let y2 = tableY + 50;
    payslip.deductions.forEach(d => {
        doc.text(`${d.type}`, tableX + 270, y2);
        doc.text(`Rs . ${d.amount.toFixed(2)}`, tableX + 400, y2, { align:"right", width: 80 });
        doc.font("Helvetica");
        y2 += 20;
    });

    doc.moveTo(tableX + 20, 435)
    .lineTo(270, 435)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    doc.moveTo(320, 435)
    .lineTo(530, 435)
    .dash(2, { space: 2 })
    .strokeColor("#999999")
    .stroke()
    .undash();

    //let bottomY = tableY + tableHeight - 30;
    doc.font("Helvetica-Bold").text("Gross Earnings", tableX + 20, 443);
    doc.text(`Rs . ${payslip.grossEarnings.toFixed(2)}`, tableX + 140, 443, {align: "right", width: 80 });

    doc.font("Helvetica-Bold").text("Total Deductions", tableX + 270, 443);
    doc.text(`Rs . ${payslip.totalDeductions.toFixed(2)}`, tableX + 400, 443, {align: "right", width: 80 });

    doc.save();
    doc.roundedRect(50, 490, 500, 45, radius)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();

    const greenWidth = 150; // adjust width of green area
    doc.save();
    doc.roundedRect(50 + (500 - greenWidth), 490, greenWidth, 45, radius)
        .clip(); // clip only right section
    doc.rect(50 + (500 - greenWidth), 490, greenWidth, 45)
        .fill("#e6f9ef"); // light green fill
    doc.restore();

    // Left text
    doc.font("Helvetica-Bold").fontSize(10).fillColor("black")
    .text("TOTAL NET PAYABLE", 50 + 10, 490 + 13);

    doc.font("Helvetica").fontSize(10).fillColor("gray")
    .text("Gross Earnings", 50 + 10, 490 + 27);

    // Right text (Net Pay in bold)
    doc.font("Helvetica-Bold").fontSize(14).fillColor("black")
    .text(`Rs. ${payslip.grossEarnings.toFixed(2)}`, 310, 490 + 18, {
        align: "right",
        width: boxWidth - 10
    });

    const amountWords = numberToWords.toWords(payslip.grossEarnings).replace(/\b\w/g, c => c.toUpperCase());
    doc.font("Helvetica-Bold").fontSize(10).fillColor("black").text(`${amountWords} Rupees Only`, 50, 550, { width: 380, align: "center" });
    doc.moveTo(50, 570).lineTo(550, 570).strokeColor("#ccc").stroke();
    
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Server error while generating PDF' });
  }
});


// Delete payslip by ID
router.delete('/payslip/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const payslip = await Payslip.findByIdAndDelete(req.params.id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    res.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ message: 'Server error while deleting payslip' });
  }
});

export default router;