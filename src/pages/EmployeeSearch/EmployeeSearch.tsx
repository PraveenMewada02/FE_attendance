import { useState } from 'react';
import { Calendar, Search, Mail, Send } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

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

  const handleSendEmail = async () => {
    if (!empcode.trim()) {
      setEmailError('Please search for an employee first');
      return;
    }

    if (!employeeEmail.trim()) {
      setEmailError('Please enter employee email address');
      return;
    }

    if (data.length === 0) {
      setEmailError('No attendance data to send. Please search first.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeEmail.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const employeeName = data.length > 0 ? data[0].name : 'Employee';
      
      const response = await emailApi.sendAttendanceReport({
        empcode: empcode.trim(),
        email: employeeEmail.trim(),
        employeeName: employeeName,
        fromDate: fromDate,
        toDate: toDate,
        attendanceData: data,
      });

      if (response.error) {
        setEmailError(response.error || 'Failed to send email');
      } else {
        setEmailSuccess(`Email sent successfully to ${employeeEmail}`);
        // Clear email field after successful send
        setTimeout(() => {
          setEmployeeEmail('');
          setEmailSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error sending email:', err);
      setEmailError(err.message || 'An error occurred while sending email');
    } finally {
      setSendingEmail(false);
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
