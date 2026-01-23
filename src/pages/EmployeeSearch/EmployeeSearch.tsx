import { useState } from 'react';
import { Calendar, Search, Mail, Send, X, Users } from 'lucide-react';
import { allDataApi, emailApi } from '../../services/api';
import DataTable from '../../components/DataTable/DataTable';
import type { AllData } from '../../types';
import { format } from 'date-fns';
import { normalizeDate } from '../../utils/dateUtils';
import { exportToPDF } from '../../utils/pdfExport';
import './EmployeeSearch.css';

export default function EmployeeSearch() {
  const [data, setData] = useState<AllData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [fromDate, setFromDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [toDate, setToDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [empcode, setEmpcode] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [sendMode, setSendMode] = useState<'single' | 'multiple' | 'all'>('single');
  const [customMessage, setCustomMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [sendingProgress, setSendingProgress] = useState<{ sent: number; total: number } | null>(null);
  const [emailResults, setEmailResults] = useState<{
    totalSent: number;
    totalFailed: number;
    successful: Array<{ empcode: string; email: string; name: string }>;
    failed: Array<{ empcode: string; email: string; name: string; error: string }>;
  } | null>(null);

  const extractDataFromResponse = (response: any): any[] => {
    let dataArray: any[] = [];
    
    // Check for InOutPunchData (the actual API response structure)
    if (response.InOutPunchData) {
      dataArray = Array.isArray(response.InOutPunchData) ? response.InOutPunchData : [response.InOutPunchData];
    }
    // If response is directly an array
    else if (Array.isArray(response)) {
      dataArray = response;
    }
    // If response has a data property
    else if (response.data) {
      dataArray = Array.isArray(response.data) ? response.data : [response.data];
    }
    // If response is an object with nested data
    else if (response.PunchData) {
      dataArray = Array.isArray(response.PunchData) ? response.PunchData : [response.PunchData];
    }
    // If response is a single object, wrap it in array
    else if (typeof response === 'object' && response !== null) {
      // Check if it looks like a data record
      if (response.Empcode || response.empcode) {
        dataArray = [response];
      }
    }
    
    return dataArray;
  };

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    if (!empcode.trim()) {
      setError('Please enter an employee code');
      return;
    }

    // Validate and normalize date formats
    const normalizedFromDate = normalizeDate(fromDate);
    const normalizedToDate = normalizeDate(toDate);

    if (!normalizedFromDate || !normalizedToDate) {
      setError('Invalid date format. Please use DD/MM/YYYY format (e.g., 22/01/2026)');
      return;
    }

    // Update dates if they were normalized
    if (normalizedFromDate !== fromDate) {
      setFromDate(normalizedFromDate);
    }
    if (normalizedToDate !== toDate) {
      setToDate(normalizedToDate);
    }

    setLoading(true);
    setError(null);
    setEmailError(null);
    setEmailSuccess(null);
    setEmailResults(null);

    try {
      const finalFromDate = normalizedFromDate || fromDate;
      const finalToDate = normalizedToDate || toDate;
      
      console.log('Searching employee attendance:', { 
        empcode: empcode.trim(), 
        fromDate: finalFromDate, 
        toDate: finalToDate 
      });
      
      let response: any;
      response = await allDataApi.filter(empcode.trim(), finalFromDate, finalToDate);

      console.log('API Response:', response);

      if (response.error || (response.Error === true)) {
        setError(response.error || response.Msg || 'An error occurred');
        setData([]);
      } else {
        // Handle different response formats
        let dataArray: any[] = [];
        
        // Check for InOutPunchData (the actual API response structure)
        if (response.InOutPunchData) {
          dataArray = Array.isArray(response.InOutPunchData) ? response.InOutPunchData : [response.InOutPunchData];
        }
        // If response is directly an array
        else if (Array.isArray(response)) {
          dataArray = response;
        }
        // If response has a data property
        else if (response.data) {
          dataArray = Array.isArray(response.data) ? response.data : [response.data];
        }
        // If response is an object with nested data
        else if (response.PunchData) {
          dataArray = Array.isArray(response.PunchData) ? response.PunchData : [response.PunchData];
        }
        // If response is a single object, wrap it in array
        else if (typeof response === 'object' && response !== null) {
          // Check if it looks like a data record
          if (response.Empcode || response.empcode) {
            dataArray = [response];
          }
        }
        
        console.log('Extracted data array:', dataArray);
        console.log('Data array length:', dataArray.length);
        
        // Transform API response to AllData format
        const transformedData: AllData[] = dataArray.map((item: any) => ({
          empcode: item.Empcode || item.empcode || '',
          name: (item.Name || item.name || '').trim(),
          in_time: item.INTime || item.in_time || item.InTime || '--:--',
          out_time: item.OUTTime || item.out_time || item.OutTime || '--:--',
          work_time: item.WorkTime || item.work_time || '00:00',
          over_time: item.OverTime || item.over_time || '00:00',
          break_time: item.BreakTime || item.break_time || '00:00',
          status: item.Status || item.status || '',
          date_string: item.DateString || item.date_string || item.Date || '',
          remark: item.Remark || item.remark || '--',
          erl_out: item.Erl_Out || item.ErlOut || item.erl_out || '00:00',
          late_in: item.Late_In || item.LateIn || item.late_in || '00:00',
        }));

        console.log('Transformed data:', transformedData);
        setData(transformedData);
        
        // Extract employee email if available from the first record
        if (transformedData.length > 0 && transformedData[0].name) {
          // You might want to fetch employee email from a separate API
          // For now, we'll use the email input field
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An error occurred while fetching data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const addEmailToList = () => {
    const email = emailInput.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (emailList.includes(email)) {
      setEmailError('This email is already in the list');
      return;
    }

    setEmailList([...emailList, email]);
    setEmailInput('');
    setEmailError(null);
  };

  const removeEmailFromList = (emailToRemove: string) => {
    setEmailList(emailList.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && sendMode === 'multiple') {
      e.preventDefault();
      addEmailToList();
    }
  };

  const getUniqueEmployees = () => {
    const employeeMap = new Map<string, { empcode: string; name: string }>();
    data.forEach(item => {
      if (item.empcode && !employeeMap.has(item.empcode)) {
        employeeMap.set(item.empcode, {
          empcode: item.empcode,
          name: item.name,
        });
      }
    });
    return Array.from(employeeMap.values());
  };

  const handleSendEmail = async () => {
    if (data.length === 0) {
      setEmailError('No attendance data to send. Please search first.');
      return;
    }

    let emailsToSend: string[] = [];

    if (sendMode === 'single') {
      if (!employeeEmail.trim()) {
        setEmailError('Please enter employee email address');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employeeEmail.trim())) {
        setEmailError('Please enter a valid email address');
        return;
      }
      emailsToSend = [employeeEmail.trim()];
    } else if (sendMode === 'multiple') {
      if (emailList.length === 0) {
        setEmailError('Please add at least one email address');
        return;
      }
      emailsToSend = emailList;
    } else if (sendMode === 'all') {
      // For "send to all", we need to fetch all employees for the date range
      // Since we're searching for a specific employee, we need to fetch all data first
      try {
        setSendingEmail(true);
        setEmailError(null);
        setEmailSuccess(null);
        
        // Fetch all employees for the date range (without empcode filter)
        const allResponse: any = await allDataApi.search(fromDate, toDate);
        const allDataArray = extractDataFromResponse(allResponse);
        
        if (allDataArray.length === 0) {
          setEmailError('No employees found for the selected date range.');
          setSendingEmail(false);
          return;
        }
        
        // Get unique employees
        const employeeMap = new Map<string, { empcode: string; name: string }>();
        allDataArray.forEach((item: any) => {
          const empcode = item.Empcode || item.empcode;
          if (empcode && !employeeMap.has(empcode)) {
            employeeMap.set(empcode, {
              empcode: empcode,
              name: (item.Name || item.name || '').trim(),
            });
          }
        });
        
        const uniqueEmployees = Array.from(employeeMap.values());
        
        if (uniqueEmployees.length === 0) {
          setEmailError('No unique employees found.');
          setSendingEmail(false);
          return;
        }
        
        // For each employee, fetch their attendance data and send email
        // Note: The backend should handle getting email addresses from employee codes
        setSendingProgress({ sent: 0, total: uniqueEmployees.length });
        
        const successful: Array<{ empcode: string; email: string; name: string }> = [];
        const failed: Array<{ empcode: string; email: string; name: string; error: string }> = [];
        
        for (let i = 0; i < uniqueEmployees.length; i++) {
          const employee = uniqueEmployees[i];
          try {
            // Fetch attendance data for this employee
            const empResponse: any = await allDataApi.filter(employee.empcode, fromDate, toDate);
            const empDataArray = extractDataFromResponse(empResponse);
            
            // Transform to AllData format
            const transformedData: AllData[] = empDataArray.map((item: any) => ({
              empcode: item.Empcode || item.empcode || '',
              name: (item.Name || item.name || '').trim(),
              in_time: item.INTime || item.in_time || item.InTime || '--:--',
              out_time: item.OUTTime || item.out_time || item.OutTime || '--:--',
              work_time: item.WorkTime || item.work_time || '00:00',
              over_time: item.OverTime || item.over_time || '00:00',
              break_time: item.BreakTime || item.break_time || '00:00',
              status: item.Status || item.status || '',
              date_string: item.DateString || item.date_string || item.Date || '',
              remark: item.Remark || item.remark || '--',
              erl_out: item.Erl_Out || item.ErlOut || item.erl_out || '00:00',
              late_in: item.Late_In || item.LateIn || item.late_in || '00:00',
            }));
            
            // Send email - use employee code as email placeholder, backend should resolve it
            const response = await emailApi.sendAttendanceReport({
              empcode: employee.empcode,
              email: '', // Backend should get email from empcode
              employeeName: employee.name,
              fromDate: fromDate,
              toDate: toDate,
              customMessage: customMessage.trim() || undefined,
              attendanceData: transformedData,
            });
            
            if (response.error) {
              failed.push({
                empcode: employee.empcode,
                email: '', // Email resolved by backend
                name: employee.name,
                error: response.error,
              });
            } else {
              successful.push({
                empcode: employee.empcode,
                email: '', // Email resolved by backend
                name: employee.name,
              });
            }
          } catch (err: any) {
            failed.push({
              empcode: employee.empcode,
              email: '',
              name: employee.name,
              error: err.message || 'Failed to send',
            });
          }
          
          setSendingProgress({ sent: i + 1, total: uniqueEmployees.length });
        }
        
        // Store results
        const results = {
          totalSent: successful.length,
          totalFailed: failed.length,
          successful,
          failed,
        };
        setEmailResults(results);
        
        // Show results
        if (successful.length > 0 && failed.length === 0) {
          setEmailSuccess(
            `Successfully sent ${successful.length} email${successful.length > 1 ? 's' : ''} to all ${uniqueEmployees.length} employee${uniqueEmployees.length > 1 ? 's' : ''}`
          );
          setTimeout(() => {
            setCustomMessage('');
            setEmailSuccess(null);
            setEmailResults(null);
          }, 10000);
        } else if (successful.length > 0 && failed.length > 0) {
          setEmailError(
            `Sent ${successful.length} email${successful.length > 1 ? 's' : ''} successfully, but ${failed.length} failed. See details below.`
          );
        } else {
          setEmailError(`Failed to send all emails. See details below.`);
        }
        
        setSendingEmail(false);
        setSendingProgress(null);
        return;
      } catch (err: any) {
        console.error('Error sending to all employees:', err);
        setEmailError(err.message || 'An error occurred while sending emails to all employees');
        setSendingEmail(false);
        setSendingProgress(null);
        return;
      }
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);
    setEmailResults(null);
    setSendingProgress({ sent: 0, total: emailsToSend.length });

    try {
      const employeeName = data.length > 0 ? data[0].name : 'Employee';
      const employeeEmpcode = empcode.trim();
      const successful: Array<{ empcode: string; email: string; name: string }> = [];
      const failed: Array<{ empcode: string; email: string; name: string; error: string }> = [];

      // Send emails to all recipients
      for (let i = 0; i < emailsToSend.length; i++) {
        const email = emailsToSend[i];
        try {
          const response = await emailApi.sendAttendanceReport({
            empcode: employeeEmpcode,
            email: email,
            employeeName: employeeName,
            fromDate: fromDate,
            toDate: toDate,
            customMessage: customMessage.trim() || undefined,
            attendanceData: data,
          });

          if (response.error) {
            failed.push({
              empcode: employeeEmpcode,
              email: email,
              name: employeeName,
              error: response.error,
            });
          } else {
            successful.push({
              empcode: employeeEmpcode,
              email: email,
              name: employeeName,
            });
          }
        } catch (err: any) {
          failed.push({
            empcode: employeeEmpcode,
            email: email,
            name: employeeName,
            error: err.message || 'Failed to send',
          });
        }

        setSendingProgress({ sent: i + 1, total: emailsToSend.length });
      }

      // Store results
      const results = {
        totalSent: successful.length,
        totalFailed: failed.length,
        successful,
        failed,
      };
      setEmailResults(results);

      // Show results
      if (successful.length > 0 && failed.length === 0) {
        setEmailSuccess(
          `Successfully sent ${successful.length} email${successful.length > 1 ? 's' : ''} to ${emailsToSend.length} recipient${emailsToSend.length > 1 ? 's' : ''}`
        );
        // Clear fields after successful send
        setTimeout(() => {
          setEmployeeEmail('');
          setEmailList([]);
          setEmailInput('');
          setCustomMessage('');
          setEmailSuccess(null);
          setEmailResults(null);
        }, 10000);
      } else if (successful.length > 0 && failed.length > 0) {
        setEmailError(
          `Sent ${successful.length} email${successful.length > 1 ? 's' : ''} successfully, but ${failed.length} failed. See details below.`
        );
      } else {
        setEmailError(`Failed to send all emails. See details below.`);
      }
    } catch (err: any) {
      console.error('Error sending email:', err);
      setEmailError(err.message || 'An error occurred while sending email');
    } finally {
      setSendingEmail(false);
      setSendingProgress(null);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const employeeName = data.length > 0 ? data[0].name : 'Employee';
    exportToPDF({
      title: `Employee Attendance Report - ${employeeName}`,
      filename: `attendance_${empcode}_${fromDate.replace(/\//g, '_')}_${toDate.replace(/\//g, '_')}.pdf`,
      dateRange: `Employee: ${empcode} | Date Range: ${fromDate} to ${toDate}`,
      columns: [
        { header: 'Emp Code', dataKey: 'empcode' },
        { header: 'Employee Name', dataKey: 'name' },
        { header: 'Date', dataKey: 'date_string' },
        { header: 'In Time', dataKey: 'in_time' },
        { header: 'Out Time', dataKey: 'out_time' },
        { header: 'Work Time', dataKey: 'work_time' },
        { header: 'Break Time', dataKey: 'break_time' },
        { header: 'Over Time', dataKey: 'over_time' },
        { header: 'Late In', dataKey: 'late_in' },
        { header: 'Early Out', dataKey: 'erl_out' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Remark', dataKey: 'remark' },
      ],
      data: data,
    });
  };

  const columns = [
    { 
      key: 'empcode', 
      header: 'Emp Code', 
      sortable: true,
      render: (value: string) => <span className="empcode-cell">{value}</span>
    },
    { 
      key: 'name', 
      header: 'Employee Name', 
      sortable: true,
      render: (value: string) => <span className="name-cell">{value}</span>
    },
    { 
      key: 'date_string', 
      header: 'Date', 
      sortable: true,
      render: (value: string) => <span className="date-cell">{value}</span>
    },
    { 
      key: 'in_time', 
      header: 'In Time', 
      sortable: true,
      render: (value: string) => (
        <span className={value === '--:--' ? 'time-missing' : 'time-value'}>
          {value}
        </span>
      )
    },
    { 
      key: 'out_time', 
      header: 'Out Time', 
      sortable: true,
      render: (value: string) => (
        <span className={value === '--:--' ? 'time-missing' : 'time-value'}>
          {value}
        </span>
      )
    },
    { 
      key: 'work_time', 
      header: 'Work Time', 
      sortable: true,
      render: (value: string) => (
        <span className={value === '00:00' ? 'time-zero' : 'time-value'}>
          {value}
        </span>
      )
    },
    { 
      key: 'break_time', 
      header: 'Break Time', 
      sortable: true,
      render: (value: string) => (
        <span className={value === '00:00' ? 'time-zero' : 'time-value'}>
          {value}
        </span>
      )
    },
    { 
      key: 'over_time', 
      header: 'Over Time', 
      sortable: true,
      render: (value: string) => (
        <span className={value === '00:00' ? 'time-zero' : 'time-value'}>
          {value}
        </span>
      )
    },
    { 
      key: 'late_in', 
      header: 'Late In', 
      sortable: true,
      render: (value: string) => (
        <span className={value === '00:00' ? 'time-zero' : 'time-late'}>
          {value}
        </span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true,
      render: (value: string) => {
        const statusClass = value === 'P' ? 'status-present' : value === 'A' ? 'status-absent' : 'status-other';
        const statusText = value === 'P' ? 'Present' : value === 'A' ? 'Absent' : value;
        return <span className={`status-badge ${statusClass}`}>{statusText}</span>;
      }
    },
    { 
      key: 'remark', 
      header: 'Remark', 
      sortable: false,
      render: (value: string) => (
        <span className="remark-cell" title={value}>
          {value === '--' ? '-' : value}
        </span>
      )
    },
  ];

  return (
    <div className="employee-search-page">
      <div className="page-header">
        <h2>Employee Attendance Search</h2>
        <p>Search for a specific employee's attendance records and send via email</p>
      </div>

      <div className="search-panel">
        <div className="search-form">
          <div className="form-group">
            <label>
              <Search size={16} />
              Employee Code *
            </label>
            <input
              type="text"
              placeholder="Enter employee code"
              value={empcode}
              onChange={(e) => setEmpcode(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>
              <Calendar size={16} />
              From Date (DD/MM/YYYY) *
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>
              <Calendar size={16} />
              To Date (DD/MM/YYYY) *
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <button className="search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <div className="results-section">
          <div className="email-section">
            <div className="email-mode-selector">
              <label className="mode-label">Send Mode:</label>
              <div className="mode-buttons">
                <button
                  className={`mode-btn ${sendMode === 'single' ? 'active' : ''}`}
                  onClick={() => {
                    setSendMode('single');
                    setEmailError(null);
                  }}
                  disabled={sendingEmail}
                >
                  <Mail size={16} />
                  Single Email
                </button>
                <button
                  className={`mode-btn ${sendMode === 'multiple' ? 'active' : ''}`}
                  onClick={() => {
                    setSendMode('multiple');
                    setEmailError(null);
                  }}
                  disabled={sendingEmail}
                >
                  <Mail size={16} />
                  Multiple Emails
                </button>
                <button
                  className={`mode-btn ${sendMode === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSendMode('all');
                    setEmailError(null);
                  }}
                  disabled={sendingEmail}
                >
                  <Users size={16} />
                  All Employees
                </button>
              </div>
            </div>

            {sendMode === 'single' && (
              <div className="email-form">
                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    Employee Email *
                  </label>
                  <input
                    type="email"
                    placeholder="employee@example.com"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    disabled={sendingEmail}
                  />
                </div>
                <button 
                  className="email-btn" 
                  onClick={handleSendEmail} 
                  disabled={sendingEmail || !employeeEmail.trim()}
                >
                  <Send size={16} />
                  {sendingEmail ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            )}

            {sendMode === 'multiple' && (
              <div className="email-form-multiple">
                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    Add Email Addresses *
                  </label>
                  <div className="email-input-group">
                    <input
                      type="email"
                      placeholder="Enter email and press Enter or click Add"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendingEmail}
                    />
                    <button
                      className="add-email-btn"
                      onClick={addEmailToList}
                      disabled={sendingEmail || !emailInput.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {emailList.length > 0 && (
                    <div className="email-list">
                      {emailList.map((email, index) => (
                        <div key={index} className="email-tag">
                          <span>{email}</span>
                          <button
                            className="remove-email-btn"
                            onClick={() => removeEmailFromList(email)}
                            disabled={sendingEmail}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  className="email-btn" 
                  onClick={handleSendEmail} 
                  disabled={sendingEmail || emailList.length === 0}
                >
                  <Send size={16} />
                  {sendingEmail ? `Sending... (${sendingProgress?.sent || 0}/${sendingProgress?.total || 0})` : `Send to ${emailList.length} Email${emailList.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}

            {sendMode === 'all' && (
              <div className="email-form-all">
                <div className="all-employees-info">
                  <p>This will send attendance reports to all employees found in the search results.</p>
                  <p className="info-note">Note: Email addresses need to be available in the system for each employee.</p>
                  <div className="employee-count">
                    <strong>Total unique employees: {getUniqueEmployees().length}</strong>
                  </div>
                </div>
                <button 
                  className="email-btn" 
                  onClick={handleSendEmail} 
                  disabled={sendingEmail || data.length === 0}
                >
                  <Users size={16} />
                  {sendingEmail ? `Sending... (${sendingProgress?.sent || 0}/${sendingProgress?.total || 0})` : `Send to All Employees`}
                </button>
              </div>
            )}

            {sendingProgress && (
              <div className="sending-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(sendingProgress.sent / sendingProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  Sending {sendingProgress.sent} of {sendingProgress.total} emails...
                </p>
              </div>
            )}
            <div className="form-group custom-message-group">
              <label>
                Custom Message (Optional)
              </label>
              <textarea
                placeholder="Enter a custom message that will appear in the email after the period line. You can use multiple lines."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={sendingEmail}
                rows={4}
                className="custom-message-textarea"
              />
              <p className="form-hint">This message will appear in the email after the date period information.</p>
            </div>
            {emailError && (
              <div className="email-error">
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="email-success">
                {emailSuccess}
              </div>
            )}
            
            {emailResults && (
              <div className="email-results">
                <div className="results-header">
                  <h3>Email Sending Results</h3>
                  <div className="results-summary-stats">
                    <div className="stat-item success">
                      <span className="stat-label">Sent:</span>
                      <span className="stat-value">{emailResults.totalSent}</span>
                    </div>
                    <div className="stat-item failed">
                      <span className="stat-label">Failed:</span>
                      <span className="stat-value">{emailResults.totalFailed}</span>
                    </div>
                    <div className="stat-item total">
                      <span className="stat-label">Total:</span>
                      <span className="stat-value">{emailResults.totalSent + emailResults.totalFailed}</span>
                    </div>
                  </div>
                </div>

                {emailResults.successful.length > 0 && (
                  <div className="results-section success-section">
                    <h4 className="section-title success-title">
                      ✓ Successfully Sent ({emailResults.successful.length})
                    </h4>
                    <div className="empcode-list">
                      {emailResults.successful.map((item, index) => (
                        <div key={index} className="empcode-item success-item">
                          <span className="empcode-badge">{item.empcode}</span>
                          <span className="empcode-name">{item.name}</span>
                          {item.email && <span className="empcode-email">{item.email}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {emailResults.failed.length > 0 && (
                  <div className="results-section failed-section">
                    <h4 className="section-title failed-title">
                      ✗ Failed to Send ({emailResults.failed.length})
                    </h4>
                    <div className="empcode-list">
                      {emailResults.failed.map((item, index) => (
                        <div key={index} className="empcode-item failed-item">
                          <span className="empcode-badge">{item.empcode}</span>
                          <span className="empcode-name">{item.name}</span>
                          {item.email && <span className="empcode-email">{item.email}</span>}
                          <span className="empcode-error" title={item.error}>
                            {item.error}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="results-summary">
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">Total Records</span>
                <span className="summary-value">{data.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Present</span>
                <span className="summary-value present">{data.filter(d => d.status === 'P').length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Absent</span>
                <span className="summary-value absent">{data.filter(d => d.status === 'A').length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Late Arrivals</span>
                <span className="summary-value late">{data.filter(d => d.late_in !== '00:00' && d.late_in !== '').length}</span>
              </div>
            </div>
          </div>
          <DataTable
            data={data}
            columns={columns}
            loading={loading}
            onExport={handleExport}
            searchable={true}
            searchKeys={['date_string', 'status']}
          />
        </div>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="empty-state">
          <Search size={48} />
          <p>Enter employee code and date range, then click Search to view attendance data</p>
        </div>
      )}
    </div>
  );
}
