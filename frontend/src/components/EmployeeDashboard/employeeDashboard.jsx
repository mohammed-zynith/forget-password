import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeDashService } from '../../services/employeeDash';
import './employeeDashboard.css';
import { Navigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { user , logout } = useAuth();
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [currentSalary, setCurrentSalary] = useState(null);
  const [salaryStats, setSalaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadEmployeeData();
    }
  }, [user]);

  

  const handleLogout = () => {
    logout();
    Navigate('/admin/login');
  };

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Load all employee data in parallel
      const [
        profileResponse,
        payslipsResponse,
        salaryHistoryResponse,
        currentSalaryResponse,
        salaryStatsResponse
      ] = await Promise.all([
        employeeDashService.getEmployeeProfile(),
        employeeDashService.getEmployeePayslips(),
        employeeDashService.getSalaryHistory(),
        employeeDashService.getCurrentSalary(),
        employeeDashService.getSalaryStats()
      ]);

      setEmployeeDetails(profileResponse.employee);
      setPayslips(payslipsResponse.payslips || []);
      setSalaryHistory(salaryHistoryResponse.salaries || []);
      setCurrentSalary(currentSalaryResponse.currentSalary);
      setSalaryStats(salaryStatsResponse.stats);

    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      // This would need to be implemented in your employeeDashService
      const blob = await employeeDashService.downloadPayslip(payslipId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading payslip');
    }
  };

  const handleDownloadSalaryPayslip = async (salaryId) => {
  try {
    // Find the corresponding payslip for this salary record
    const correspondingPayslip = payslips.find(payslip => 
      payslip.month === salaryHistory.find(s => s._id === salaryId)?.month &&
      payslip.year === salaryHistory.find(s => s._id === salaryId)?.year
    );

    if (correspondingPayslip) {
      await handleDownloadPayslip(correspondingPayslip._id);
    } else {
      // If no direct match found, try to download using salary ID
      // You might need to implement a separate service method for this
      const blob = await employeeDashService.downloadPayslipBySalaryId(salaryId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payslip-${salaryId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error downloading salary payslip:', error);
    alert('Error downloading payslip. Please try again or contact HR.');
  }
};

  const handleViewPayslip = async (payslipId) => {
    try {
      const response = await employeeDashService.getPayslipDetails(payslipId);
      setSelectedPayslip(response.payslip);
      setShowPayslipModal(true);
    } catch (error) {
      alert('Error loading payslip details');
    }
  };

  // NEW FUNCTION: Handle viewing payslip from salary history
  const handleViewSalaryPayslip = async (salaryId) => {
    try {
      // Find the corresponding payslip for this salary record
      const salaryRecord = salaryHistory.find(s => s._id === salaryId);
      if (!salaryRecord) {
        alert('Salary record not found');
        return;
      }

      // Find matching payslip by month and year
      const correspondingPayslip = payslips.find(payslip => 
        payslip.month === salaryRecord.month && 
        payslip.year === salaryRecord.year
      );

      if (correspondingPayslip) {
        // If payslip exists, view it
        await handleViewPayslip(correspondingPayslip._id);
      } 
    } catch (error) {
      console.error('Error viewing salary payslip:', error);
      alert('Error loading payslip details. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || monthNumber;
  };

  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {employeeDetails?.name || 'Employee'}! 👋</h1>
          <p>Here's your professional dashboard and salary information</p>
        </div>
        <div className="employee-badge">
          <div className="badge-avatar">
            {employeeDetails?.name?.charAt(0) || 'E'}
          </div>
          <div className="badge-info">
            <span className="employee-id">{employeeDetails?.employeeId}</span>
            <span className="employee-role">{employeeDetails?.designation}</span>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        {/* <button 
          className={`tab-button ${activeTab === 'payslips' ? 'active' : ''}`}
          onClick={() => setActiveTab('payslips')}
        >
          💰 Payslips
        </button> */}
        <button 
          className={`tab-button ${activeTab === 'salary' ? 'active' : ''}`}
          onClick={() => setActiveTab('salary')}
        >
          💵 Salary History
        </button>
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>Total Payslips</h3>
                  <span className="stat-number">{payslips.length}</span>
                  <span className="stat-change">Available for download</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <h3>Employment Date</h3>
                  <span className="stat-number">
                    {employeeDetails?.joiningDate ? 
                      new Date(employeeDetails.joiningDate).getFullYear() : 'N/A'
                    }
                  </span>
                  <span className="stat-change">
                    {employeeDetails?.joiningDate ? 
                      formatDate(employeeDetails.joiningDate) : 'Not available'
                    }
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💵</div>
                <div className="stat-content">
                  <h3>Total Earned</h3>
                  <span className="stat-number">
                    {salaryStats ? formatCurrency(salaryStats.totalEarned) : 'N/A'}
                  </span>
                  <span className="stat-change">
                    {salaryStats?.totalSalaries || 0} salary records
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Average Salary</h3>
                  <span className="stat-number">
                    {salaryStats ? formatCurrency(salaryStats.averageSalary) : 'N/A'}
                  </span>
                  <span className="stat-change">
                    Current role
                  </span>
                </div>
              </div>
            </div>

            {/* Current Salary Card */}
            {currentSalary && (
              <div className="content-section">
                <h3>Current Month Salary</h3>
                <div className="current-salary-card">
                  <div className="salary-period">
                    {currentSalary.month} {currentSalary.year}
                  </div>
                  <div className="salary-amount">
                    {formatCurrency(currentSalary.netPay)}
                  </div>
                  <div className="salary-details">
                    <div className="detail-item">
                      <span>Basic Salary:</span>
                      <span>{formatCurrency(currentSalary.basicSalary)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Gross Earnings:</span>
                      <span>{formatCurrency(currentSalary.grossEarnings)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Deductions:</span>
                      <span className="text-danger">
                        -{formatCurrency(currentSalary.totalDeductions)}
                      </span>
                    </div>
                    <div className="detail-item total">
                      <span>Net Pay:</span>
                      <span className="net-pay">
                        {formatCurrency(currentSalary.netPay)}
                      </span>
                    </div>
                  </div>
                  <div className="salary-status">
                    <span className={`status-badge status-${currentSalary.status}`}>
                      {currentSalary.status}
                    </span>
                    {currentSalary.payDate && (
                      <span className="pay-date">
                        Paid on: {formatDate(currentSalary.payDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Payslips Preview */}
            <div className="content-section">
              <div className="section-header">
                <h3>Recent Payslips</h3>
                <button 
                  className="view-all-btn"
                  onClick={() => setActiveTab('salary')}
                >
                  View All
                </button>
              </div>
              <div className="payslips-preview">
                {payslips.slice(0, 3).map((payslip) => (
                  <div key={payslip._id} className="payslip-preview-card">
                    <div className="payslip-header">
                      <span className="payslip-period">
                        {payslip.month} {payslip.year}
                      </span>
                      <span className="payslip-amount">
                        {formatCurrency(payslip.netPay)}
                      </span>
                    </div>
                    <div className="payslip-date">
                      Generated: {formatDate(payslip.createdAt)}
                    </div>
                    <div className="payslip-actions">
                      <button
                        className="action-btn primary"
                        onClick={() => handleViewPayslip(payslip._id)}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn success"
                        onClick={() => handleDownloadPayslip(payslip._id)}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 4M12 16L8 12M12 16L16 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M4 20H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {payslips.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <h4>No Payslips Available</h4>
                    <p>Your payslips will appear here once they are generated by HR.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* {activeTab === 'payslips' && (
          <div className="payslips-tab">
            <div className="content-section">
              <div className="section-header">
                <h3>All Payslips</h3>
                <span className="payslip-count">{payslips.length} payslips</span>
              </div>
              
              <div className="payslips-grid">
                {payslips.map((payslip) => (
                  <div key={payslip._id} className="payslip-card">
                    <div className="payslip-card-header">
                      <div className="payslip-info">
                        <h4>{payslip.month} {payslip.year}</h4>
                        <span className="payslip-id">#{payslip._id.slice(-8)}</span>
                      </div>
                      <div className="payslip-amount-main">
                        {formatCurrency(payslip.netPay)}
                      </div>
                    </div>

                    <div className="payslip-details">
                      <div className="detail-row">
                        <span>Gross Earnings:</span>
                        <span>{formatCurrency(payslip.grossEarnings)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Total Deductions:</span>
                        <span className="text-danger">
                          -{formatCurrency(payslip.totalDeductions)}
                        </span>
                      </div>
                      <div className="detail-row total">
                        <span>Net Pay:</span>
                        <span className="net-pay">
                          {formatCurrency(payslip.netPay)}
                        </span>
                      </div>
                    </div>

                    <div className="payslip-card-footer">
                      <span className="payslip-date">
                        {payslip.payDate ? `Paid: ${formatDate(payslip.payDate)}` : `Generated: ${formatDate(payslip.createdAt)}`}
                      </span>
                      <div className="payslip-actions">
                        <button
                          className="action-btn primary"
                          onClick={() => handleViewPayslip(payslip._id)}
                        >
                          View Details
                        </button>
                        <button
                          className="action-btn success"
                          onClick={() => handleDownloadPayslip(payslip._id)}
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {payslips.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">💰</div>
                    <h4>No Payslips Found</h4>
                    <p>Your payslips will be available here once processed by the HR department.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )} */}

        {activeTab === 'salary' && (
          <div className="salary-tab">
            <div className="content-section">
              <div className="section-header">
                <h3>Salary History</h3>
                <span className="payslip-count">{salaryHistory.length} records</span>
              </div>

              {/* Salary Statistics */}
              {salaryStats && (
                <div className="stats-cards-horizontal">
                  <div className="stat-card-small">
                    <div className="stat-value">{formatCurrency(salaryStats.highestSalary)}</div>
                    <div className="stat-label">Highest Salary</div>
                  </div>
                  <div className="stat-card-small">
                    <div className="stat-value">{salaryStats.paidMonths}</div>
                    <div className="stat-label">Paid Months</div>
                  </div>
                  <div className="stat-card-small">
                    <div className="stat-value">{formatCurrency(salaryStats.totalEarned)}</div>
                    <div className="stat-label">Total Earned</div>
                  </div>
                </div>
              )}

              {/* Salary History Table */}
              <div className="salary-table-container">
                <table className="salary-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Basic Salary</th>
                      <th>Gross Earnings</th>
                      <th>Deductions</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                      <th>Pay Date</th>
                      <th>Action</th> 
                    </tr>
                  </thead>
                  <tbody>
                    {salaryHistory.map((salary) => (
                      <tr key={salary._id}>
                        <td>
                          <strong>{salary.month} {salary.year}</strong>
                        </td>
                        <td>{formatCurrency(salary.basicSalary)}</td>
                        <td>{formatCurrency(salary.grossEarnings)}</td>
                        <td className="text-danger">
                          -{formatCurrency(salary.totalDeductions)}
                        </td>
                        <td className="net-pay">
                          {formatCurrency(salary.netPay)}
                        </td>
                        <td>
                          <span className={`status-badge status-${salary.status}`}>
                            {salary.status}
                          </span>
                        </td>
                        <td>
                          {salary.payDate ? formatDate(salary.payDate) : 'Pending'}
                        </td>
                        <td>
                          <div className="action-buttons">
                      <button
                        className="action-btn primary"
                        onClick={() => handleViewSalaryPayslip(salary._id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      {/* Download button for payslip */}
                        <button
                        className="action-btn success"
                        onClick={() => handleDownloadSalaryPayslip(salary._id)}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16L12 4M12 16L8 12M12 16L16 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M4 20H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                       </div>
                      </td>
                      </tr>
                    ))}
                    {salaryHistory.length === 0 && (
                      <tr>
                        <td colSpan="7" className="empty-table">
                          <div className="empty-state">
                            <div className="empty-icon">💵</div>
                            <h4>No Salary History</h4>
                            <p>Your salary records will appear here once processed.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-tab">
            <div className="content-section">
              <h3>Professional Details</h3>
              <div className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {employeeDetails?.name?.charAt(0) || 'E'}
                  </div>
                  <div className="profile-info">
                    <h2>{employeeDetails?.name || 'N/A'}</h2>
                    <p>{employeeDetails?.designation || 'N/A'} • {employeeDetails?.department || 'N/A'}</p>
                  </div>
                </div>

                <div className="profile-details-grid">
                  <div className="detail-group">
                    <label>Employee ID</label>
                    <span>{employeeDetails?.employeeId || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Email Address</label>
                    <span>{employeeDetails?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Phone Number</label>
                    <span>{employeeDetails?.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Date of Joining</label>
                    <span>
                      {employeeDetails?.joiningDate ? 
                        formatDate(employeeDetails.joiningDate) : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="detail-group">
                    <label>Department</label>
                    <span>{employeeDetails?.department || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Designation</label>
                    <span>{employeeDetails?.designation || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Address</label>
                    <span>{employeeDetails?.address || 'N/A'}</span>
                  </div>
                  <div className="detail-group">
                    <label>Member Since</label>
                    <span>
                      {employeeDetails?.createdAt ? 
                        formatDate(employeeDetails.createdAt) : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payslip Detail Modal */}
      {showPayslipModal && selectedPayslip && (
        <div className="modal-overlay" onClick={() => setShowPayslipModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payslip Details - {selectedPayslip.month} {selectedPayslip.year}</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowPayslipModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="payslip-detail-view">
                <div className="payslip-header-detail">
                  <div className="company-info">
                    <h3>Your Company Name</h3>
                    <p>Payslip for {selectedPayslip.month} {selectedPayslip.year}</p>
                  </div>
                  <div className="employee-info-detail">
                    <p><strong>Employee:</strong> {employeeDetails?.name}</p>
                    <p><strong>ID:</strong> {employeeDetails?.employeeId}</p>
                    <p><strong>Designation:</strong> {employeeDetails?.designation}</p>
                  </div>
                </div>

                <div className="payslip-breakdown">
                  <div className="earnings-section">
                    <h4>Earnings</h4>
                    <div className="breakdown-row">
                      <span>Basic Salary</span>
                      <span>{formatCurrency(selectedPayslip.basicSalary)}</span>
                    </div>
                    {selectedPayslip.earnings?.map((earning, index) => (
                      <div key={index} className="breakdown-row">
                        <span>{earning.type}</span>
                        <span>{formatCurrency(earning.amount)}</span>
                      </div>
                    ))}
                    <div className="breakdown-row total">
                      <span>Total Earnings</span>
                      <span>{formatCurrency(selectedPayslip.grossEarnings)}</span>
                    </div>
                  </div>

                  <div className="deductions-section">
                    <h4>Deductions</h4>
                    {selectedPayslip.deductions?.map((deduction, index) => (
                      <div key={index} className="breakdown-row">
                        <span>{deduction.type}</span>
                        <span className="text-danger">
                          -{formatCurrency(deduction.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="breakdown-row total">
                      <span>Total Deductions</span>
                      <span className="text-danger">
                        -{formatCurrency(selectedPayslip.totalDeductions)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="payslip-summary">
                  <div className="net-pay-section">
                    <h3>Net Pay</h3>
                    <div className="net-pay-amount">
                      {formatCurrency(selectedPayslip.netPay)}
                    </div>
                  </div>
                </div>

                <div className="payslip-actions-modal">
                  <button
                    className="action-btn success"
                    onClick={() => handleDownloadPayslip(selectedPayslip._id)}
                  >
                    Download PDF
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setShowPayslipModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;