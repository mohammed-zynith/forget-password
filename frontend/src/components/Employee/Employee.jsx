import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/employee';
import { useAuth } from '../../context/AuthContext';
import { 
  OverviewCards, 
  DataTable, 
  Button, 
  Icon, // Generic Icon component (requires name prop)
  PlusIcon, // Specific icon (no name prop needed)
  EditIcon, // Specific icon (no name prop needed)
  PowerIcon // Specific icon (no name prop needed)
} from '../Common';
import './Employee.css';

const EmployeeManagement = ({ onEmployeeUpdate }) => {
  const { user, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [formAttempts, setFormAttempts] = useState(0);

  const [formData, setFormData] = useState({
    personId: '',
    email: '',
    password: '',
    name: '',
    designation: '',
    department: '',
    phone: '',
    address: '',
    panNumber: '',
    joiningDate: '',
    status: 'Active'
  });

  // Designation options
  const designationOptions = [
    'Senior Developer',
    'Junior Developer',
    'Project Manager',
    'UI/UX Designer',
    'HR Manager',
    'Finance Analyst',
    'Sales Executive'
  ];

  // Department options
  const departmentOptions = [
    'Engineering',
    'Management',
    'Design',
    'Sales',
    'HR',
    'Finance',
    'Marketing',
    'Operations',
    'IT'
  ];

  // Stats data for OverviewCards
  const stats = [
    {
      id: 1,
      label: 'Total Employees',
      value: employees.length.toString(),
      variant: 'primary'
    },
    {
      id: 2,
      label: 'Active Employees',
      value: employees.filter(emp => emp.status === 'Active').length.toString(),
      variant: 'success'
    },
    {
      id: 3,
      label: 'Inactive Employees',
      value: employees.filter(emp => emp.status === 'Inactive').length.toString(),
      variant: 'warning'
    },
    {
      id: 4,
      label: 'New This Month',
      value: '0', // You can calculate this based on joiningDate
      variant: 'info'
    }
  ];

  // Table columns configuration
  const columns = [
    {
      key: 'employeeId',
      header: 'Employee ID',
      render: (value) => (
        <div className="employee-id">{value}</div>
      )
    },
    {
      key: 'name',
      header: 'Name',
      render: (value, row) => (
        <div className="employee-info-compact">
          <div className="employee-name">{value}</div>
          <div className="employee-email">{row.email}</div>
        </div>
      )
    },
    {
      key: 'designation',
      header: 'Designation'
    },
    {
      key: 'department',
      header: 'Department',
      render: (value) => (
        <span className="department-badge">{value}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`status-badge ${value === 'Active' ? 'status-active' : 'status-inactive'}`}>
          {value}
        </span>
      )
    }
  ];

  // Table actions configuration
  const tableActions = [
    {
      icon: <EditIcon size="sm" />,
      title: 'Edit Employee',
      onClick: (employee) => handleEditEmployee(employee),
      variant: 'outline'
    },
    {
      icon: <PowerIcon size="sm" />, // No name prop needed
      title: activeTab === 'active' ? 'Deactivate Employee' : 'Activate Employee',
      onClick: (employee) => handleStatusChange(
        employee.employeeId, 
        employee.status, 
        activeTab === 'active' ? 'Inactive' : 'Active'
      ),
      variant: activeTab === 'active' ? 'danger' : 'success'
    }
  ];

  // Load employees on component mount
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data.employees);
     
      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // ID generation function
  const generateNextEmployeeId = async () => {
    try {
      console.log('🆔 Starting ID generation...');
      const latestData = await employeeService.getEmployees();
      const existingEmployees = latestData.employees;
     
      console.log('📊 Total employees:', existingEmployees.length);
     
      const zicEmployeeIds = existingEmployees
        .map(emp => emp.employeeId)
        .filter(id => id && id.startsWith('ZIC'))
        .sort();

      console.log('🔍 Found ZIC IDs:', zicEmployeeIds);

      if (zicEmployeeIds.length === 0) {
        console.log('✅ No existing ZIC IDs, starting from ZIC001');
        return 'ZIC001';
      }

      const numbers = zicEmployeeIds.map(id => {
        const numStr = id.replace('ZIC', '');
        return parseInt(numStr, 10) || 0;
      });

      const maxNumber = Math.max(...numbers);
      console.log('🔢 Highest number found:', maxNumber);

      for (let i = 1; i <= 5; i++) {
        const tryNumber = maxNumber + i;
        const tryId = `ZIC${tryNumber.toString().padStart(3, '0')}`;
       
        console.log(`🔄 Trying ID: ${tryId}`);
        const exists = existingEmployees.some(emp => emp.employeeId === tryId);
       
        if (!exists) {
          console.log(`✅ ID ${tryId} is available!`);
          return tryId;
        }
        console.log(`❌ ID ${tryId} already exists`);
      }

      for (let i = 1; i <= 10; i++) {
        const tryNumber = maxNumber + 10 + i;
        const tryId = `ZIC${tryNumber.toString().padStart(3, '0')}`;
       
        const exists = existingEmployees.some(emp => emp.employeeId === tryId);
        if (!exists) {
          console.log(`✅ Found available ID: ${tryId}`);
          return tryId;
        }
      }

      throw new Error('Could not find available employee ID');
    } catch (error) {
      console.error('❌ Error generating employee ID:', error);
      const timestamp = Date.now().toString().slice(-3);
      return `ZIC${timestamp}`;
    }
  };

  const checkEmployeeIdExists = (employeeId) => {
    const exists = employees.some(emp => emp.employeeId === employeeId);
    console.log(`🔍 Local check for ${employeeId}: ${exists}`);
    return exists;
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
     
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle update employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData = { ...formData };
     
      // Remove password field if it's empty (don't update password)
      if (!updateData.password) {
        delete updateData.password;
      }

      await employeeService.updateEmployee(editingEmployee.employeeId, updateData);
     
      setSuccess('Employee updated successfully!');
      setShowAddForm(false);
      setEditingEmployee(null);
     
      await loadEmployees();
     
      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }

    } catch (error) {
      console.error('Error updating employee:', error);
      setError(error.response?.data?.message || 'Failed to update employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle add button click
  const handleAddButtonClick = async () => {
    try {
      setIsGeneratingId(true);
      setError('');
      setFormAttempts(prev => prev + 1);

      console.log('🎯 Opening add form, attempt:', formAttempts + 1);
      await loadEmployees();
     
      const newId = await generateNextEmployeeId();
      console.log('🎉 Generated new ID:', newId);

      setFormData({
        personId: newId,
        email: '',
        password: '',
        name: '',
        designation: '',
        department: '',
        phone: '',
        address: '',
        panNumber: '',
        joiningDate: '',
        status: 'Active'
      });

      setShowAddForm(true);
      setEditingEmployee(null);
     
    } catch (error) {
      console.error('Error opening add form:', error);
      setError('Failed to prepare employee form. Please try again.');
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Handle status change with auto-tab switching
  const handleStatusChange = async (employeeId, currentStatus, newStatus) => {
    const confirmationMessage = `Are you sure you want to change the status from ${currentStatus} to ${newStatus}?`;
   
    if (window.confirm(confirmationMessage)) {
      try {
        await employeeService.updateEmployee(employeeId, { status: newStatus });
        loadEmployees();
        if (onEmployeeUpdate) {
          onEmployeeUpdate();
        }
        setSuccess(`Employee status changed to ${newStatus} successfully!`);
       
        // Auto-switch tabs based on new status
        if (newStatus === 'Active') {
          setActiveTab('active');
        } else {
          setActiveTab('inactive');
        }
      } catch (error) {
        setError('Error updating employee status');
        console.error('Error updating employee status:', error);
      }
    }
  };

  // Handle add employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Submitting employee:', {
        id: formData.personId,
        name: formData.name,
        email: formData.email,
        panNumber: formData.panNumber
      });

      const response = await employeeService.registerEmployee(formData);
     
      setSuccess('Employee registered successfully!');
      setShowAddForm(false);
      setEditingEmployee(null);
     
      await loadEmployees();
     
      if (onEmployeeUpdate) {
        onEmployeeUpdate();
      }

    } catch (error) {
      console.error('💥 Registration error:', error);
     
      if (error.response?.data?.message?.includes('already exists')) {
        const newId = await generateNextEmployeeId();
        setFormData(prev => ({
          ...prev,
          personId: newId
        }));
        setError(`Employee ID was taken. New ID generated: ${newId}. Please review and submit again.`);
      } else {
        setError(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      personId: employee.employeeId,
      email: employee.email,
      password: '',
      name: employee.name,
      designation: employee.designation,
      department: employee.department,
      phone: employee.phone,
      address: employee.address,
      panNumber: employee.panNumber || '',
      joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
      status: employee.status || 'Active'
    });
    setShowAddForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
   
    // Convert PAN number to uppercase as user types
    if (name === 'panNumber') {
      setFormData({
        ...formData,
        [name]: value.toUpperCase()
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCloseModal = () => {
    setShowAddForm(false);
    setEditingEmployee(null);
    setError('');
    setFormAttempts(0);
  };

  // Function to sort employees by Employee ID
  const sortEmployeesById = (employeesArray) => {
    return [...employeesArray].sort((a, b) => {
      const idA = a.employeeId?.replace(/\D/g, '') || '';
      const idB = b.employeeId?.replace(/\D/g, '') || '';
      const numA = parseInt(idA, 10) || 0;
      const numB = parseInt(idB, 10) || 0;
      return numA - numB;
    });
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.panNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter employees based on active tab
  const statusFilteredEmployees = filteredEmployees.filter(employee =>
    activeTab === 'active' ? employee.status === 'Active' : employee.status === 'Inactive'
  );

  // Sort the filtered employees by Employee ID
  const sortedEmployees = sortEmployeesById(statusFilteredEmployees);

  // Validate PAN number format
  const validatePanNumber = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  return (
    <div className="employee-management">
      {/* Success and Error Messages */}
      {success && (
        <div className="alert success-alert">
          {success}
          <button className="close-alert" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {error && (
        <div className="alert error-alert">
          {error}
          <button className="close-alert" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Overview Cards */}
      <OverviewCards stats={stats} loading={loading} />

      {/* Header Section */}
      <div className="employee-header">
        <div className="header-left">
          <h2 className="page-title">Employee Management</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search employees by ID, name, email, department, or PAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="header-right">
          <Button
            variant="primary"
            icon={<PlusIcon />}
            onClick={handleAddButtonClick}
            disabled={isGeneratingId}
            loading={isGeneratingId}
          >
            {isGeneratingId ? "Generating ID..." : "Add Employee"}
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tabs-section">
        <div className="tabs-container">
          <Button
            variant={activeTab === 'active' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('active')}
            className="tab-button"
          >
            Active Employees ({employees.filter(emp => emp.status === 'Active').length})
          </Button>
          <Button
            variant={activeTab === 'inactive' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('inactive')}
            className="tab-button"
          >
            Inactive Employees ({employees.filter(emp => emp.status === 'Inactive').length})
          </Button>
        </div>
      </div>

      {/* Employees Table */}
      <DataTable
        columns={columns}
        data={sortedEmployees}
        actions={tableActions}
        loading={loading}
        searchable={false} // We're using our own search
        emptyMessage={`No ${activeTab === 'active' ? 'active' : 'inactive'} employees found`}
        keyField="employeeId"
        className="employee-data-table"
      />

      {/* Add/Edit Employee Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
           
            <form className="employee-form" onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="personId">Employee ID</label>
                  <input
                    type="text"
                    id="personId"
                    name="personId"
                    value={formData.personId}
                    onChange={handleInputChange}
                    className="disabled-input"
                    disabled
                    required
                  />
                  <small>Auto-generated employee ID</small>
                </div>
               
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
               
                <div className="form-group">
                  <label htmlFor="password">
                    {editingEmployee ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={editingEmployee ? "Enter new password" : "Enter password"}
                    minLength="6"
                    required={!editingEmployee}
                  />
                  <small>Password must be at least 6 characters long</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="designation">Designation *</label>
                  <select
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Designation</option>
                    {designationOptions.map(designation => (
                      <option key={designation} value={designation}>{designation}</option>
                    ))}
                  </select>
                </div>
               
                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
               
                <div className="form-group">
                  <label htmlFor="panNumber">PAN Number *</label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="Enter PAN number (e.g., ABCDE1234F)"
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    title="Please enter a valid PAN number (e.g., ABCDE1234F)"
                    required
                    maxLength="10"
                    className={formData.panNumber && !validatePanNumber(formData.panNumber) ? 'invalid-input' : ''}
                  />
                  <small>Format: ABCDE1234F (5 letters, 4 digits, 1 letter)</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="joiningDate">Joining Date *</label>
                  <input
                    type="date"
                    id="joiningDate"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    rows="3"
                    required
                  />
                </div>
              </div>

              {editingEmployee && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={loading}
                  disabled={formData.panNumber && !validatePanNumber(formData.panNumber)}
                  className="submit-btn"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;