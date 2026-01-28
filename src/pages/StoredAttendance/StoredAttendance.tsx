import { useState } from 'react';
import { Calendar, Database, RefreshCw, Search } from 'lucide-react';
import { allDataApi } from '../../services/api';
import DataTable from '../../components/DataTable/DataTable';
import type { AllData } from '../../types';
import { format } from 'date-fns';
import { normalizeDate } from '../../utils/dateUtils';
import { exportToPDF } from '../../utils/pdfExport';
import './StoredAttendance.css';

interface FetchResultSummary {
  status: string;
  message: string;
  total_employees?: number;
  records_saved?: number;
  save_errors?: number;
}

export default function StoredAttendance() {
  const [fromDateFetch, setFromDateFetch] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [toDateFetch, setToDateFetch] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSummary, setFetchSummary] = useState<FetchResultSummary | null>(null);

  const [fromDate, setFromDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [toDate, setToDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [empcode, setEmpcode] = useState('');
  const [retrieveLoading, setRetrieveLoading] = useState(false);
  const [retrieveError, setRetrieveError] = useState<string | null>(null);
  const [data, setData] = useState<AllData[]>([]);

  const handleFetchAndStore = async () => {
    if (!fromDateFetch || !toDateFetch) {
      setFetchError('Please select both from and to dates');
      return;
    }

    const normalizedFrom = normalizeDate(fromDateFetch);
    const normalizedTo = normalizeDate(toDateFetch);

    if (!normalizedFrom || !normalizedTo) {
      setFetchError('Invalid date format. Please use DD/MM/YYYY (e.g., 03/03/2025)');
      return;
    }

    setFetchLoading(true);
    setFetchError(null);
    setFetchSummary(null);

    try {
      const response: any = await allDataApi.fetchAndStore(normalizedFrom, normalizedTo);

      if (response.error || response.Error) {
        setFetchError(response.error || response.Msg || 'Failed to fetch and store data');
      } else {
        setFetchSummary({
          status: response.status || response.Status || 'success',
          message: response.message || response.Msg || 'Fetch and store completed successfully.',
          total_employees:
            response.total_employees ||
            response.totalEmployees ||
            response.total_unique_employees,
          records_saved: response.records_saved || response.recordsSaved || response.saved_count,
          save_errors: response.save_errors || response.saveErrors || response.error_count,
        });
      }
    } catch (error: any) {
      setFetchError(error.message || 'An error occurred while fetching and storing data');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!fromDate || !toDate) {
      setRetrieveError('Please select both from and to dates');
      return;
    }

    const normalizedFrom = normalizeDate(fromDate);
    const normalizedTo = normalizeDate(toDate);

    if (!normalizedFrom || !normalizedTo) {
      setRetrieveError('Invalid date format. Please use DD/MM/YYYY (e.g., 03/03/2025)');
      return;
    }

    setRetrieveLoading(true);
    setRetrieveError(null);

    try {
      const response: any = await allDataApi.retrieveStored(
        normalizedFrom,
        normalizedTo,
        empcode.trim() || undefined
      );

      if (response.error || response.Error) {
        setRetrieveError(response.error || response.Msg || 'Failed to retrieve stored data');
        setData([]);
        return;
      }

      let dataArray: any[] = [];

      if (Array.isArray(response.data)) {
        dataArray = response.data;
      } else if (response.data) {
        dataArray = [response.data];
      } else if (Array.isArray(response)) {
        dataArray = response;
      }

      const transformed: AllData[] = dataArray.map((item: any) => ({
        empcode: item.empcode || item.Empcode || '',
        name: (item.name || item.Name || '').trim(),
        in_time: item.in_time || item.INTime || '--:--',
        out_time: item.out_time || item.OUTTime || '--:--',
        work_time: item.work_time || item.WorkTime || '00:00',
        over_time: item.over_time || item.OverTime || '00:00',
        break_time: item.break_time || item.BreakTime || '00:00',
        status: item.status || item.Status || '',
        date_string: item.date || item.date_string || item.DateString || '',
        remark: item.remark || item.Remark || '--',
        erl_out: item.erl_out || item.Erl_Out || '00:00',
        late_in: item.late_in || item.Late_In || '00:00',
      }));

      setData(transformed);
    } catch (error: any) {
      setRetrieveError(error.message || 'An error occurred while retrieving data');
      setData([]);
    } finally {
      setRetrieveLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    exportToPDF({
      title: 'Stored Attendance Report',
      filename: `stored_attendance_${fromDate.replace(/\//g, '_')}_${toDate.replace(
        /\//g,
        '_'
      )}.pdf`,
      dateRange: `Date Range: ${fromDate} to ${toDate}`,
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
      data,
    });
  };

  const columns = [
    { key: 'empcode', header: 'Emp Code', sortable: true },
    { key: 'name', header: 'Employee Name', sortable: true },
    { key: 'date_string', header: 'Date', sortable: true },
    { key: 'in_time', header: 'In Time', sortable: true },
    { key: 'out_time', header: 'Out Time', sortable: true },
    { key: 'work_time', header: 'Work Time', sortable: true },
    { key: 'break_time', header: 'Break Time', sortable: true },
    { key: 'over_time', header: 'Over Time', sortable: true },
    { key: 'late_in', header: 'Late In', sortable: true },
    { key: 'erl_out', header: 'Early Out', sortable: true },
    { key: 'status', header: 'Status', sortable: true },
    { key: 'remark', header: 'Remark', sortable: false },
  ];

  return (
    <div className="stored-attendance-page">
      <div className="page-header">
        <h2>Stored Attendance</h2>
        <p>Fetch from external API once, then work with stored attendance data.</p>
      </div>

      <div className="stored-panels">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Database size={18} />
              <span>Step 1: Fetch &amp; Store from External API</span>
            </div>
            <p>Fetch raw data from the device/API and save it into the database.</p>
          </div>

          <div className="panel-body">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  From Date (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={fromDateFetch}
                  onChange={(e) => setFromDateFetch(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  To Date (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={toDateFetch}
                  onChange={(e) => setToDateFetch(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <button
                className="primary-btn"
                onClick={handleFetchAndStore}
                disabled={fetchLoading}
              >
                <RefreshCw size={16} />
                {fetchLoading ? 'Fetching & Storing...' : 'Fetch & Store'}
              </button>
            </div>

            {fetchError && <div className="error-message">{fetchError}</div>}

            {fetchSummary && (
              <div className="fetch-summary">
                <div>
                  <span className="summary-label">Status:</span>
                  <span className="summary-value">{fetchSummary.status}</span>
                </div>
                <div>
                  <span className="summary-label">Message:</span>
                  <span className="summary-value">{fetchSummary.message}</span>
                </div>
                {typeof fetchSummary.total_employees === 'number' && (
                  <div>
                    <span className="summary-label">Total Employees:</span>
                    <span className="summary-value">{fetchSummary.total_employees}</span>
                  </div>
                )}
                {typeof fetchSummary.records_saved === 'number' && (
                  <div>
                    <span className="summary-label">Records Saved:</span>
                    <span className="summary-value">{fetchSummary.records_saved}</span>
                  </div>
                )}
                {typeof fetchSummary.save_errors === 'number' && (
                  <div>
                    <span className="summary-label">Save Errors:</span>
                    <span className="summary-value">{fetchSummary.save_errors}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Search size={18} />
              <span>Step 2: Retrieve Stored Attendance</span>
            </div>
            <p>Work with the data already stored in the all_data table.</p>
          </div>

          <div className="panel-body">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  From Date (DD/MM/YYYY or YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  To Date (DD/MM/YYYY or YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="form-group">
                <label>
                  Empcode(s) (optional)
                </label>
                <input
                  type="text"
                  value={empcode}
                  onChange={(e) => setEmpcode(e.target.value)}
                  placeholder="0001 or 0001,0002,0003"
                />
              </div>
              <button
                className="primary-btn"
                onClick={handleRetrieve}
                disabled={retrieveLoading}
              >
                {retrieveLoading ? 'Retrieving...' : 'Retrieve Stored Data'}
              </button>
            </div>

            {retrieveError && <div className="error-message">{retrieveError}</div>}
          </div>
        </div>
      </div>

      {data.length > 0 && (
        <div className="results-section">
          <div className="results-summary">
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">Total Records</span>
                <span className="summary-value">{data.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Unique Employees</span>
                <span className="summary-value">
                  {new Set(data.map((d) => d.empcode)).size}
                </span>
              </div>
            </div>
            <button className="secondary-btn" onClick={handleExport}>
              Export to PDF
            </button>
          </div>

          <DataTable
            data={data}
            columns={columns}
            loading={retrieveLoading}
            searchable={true}
            searchKeys={['empcode', 'name', 'date_string']}
          />
        </div>
      )}
    </div>
  );
}


