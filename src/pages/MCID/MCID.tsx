import { useState } from 'react';
import { Calendar, Search, Download, RefreshCw } from 'lucide-react';
import { mcidDataApi } from '../../services/api';
import DataTable from '../../components/DataTable/DataTable';
import type { MCIDData } from '../../types';
import { format } from 'date-fns';
import { exportToPDF } from '../../utils/pdfExport';
import './MCID.css';

export default function MCID() {
  const [data, setData] = useState<MCIDData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [toDate, setToDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [empcode, setEmpcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fetchStats, setFetchStats] = useState<any>(null);

  const handleFetch = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: any = await mcidDataApi.fetch(fromDate, toDate);

      if (response.error) {
        setError(response.error);
        setData([]);
      } else {
        setFetchStats({
          saved_count: response.saved_count || 0,
          already_similar_count: response.already_similar_count || 0,
          duplicate_in_batch_count: response.duplicate_in_batch_count || 0,
          count: response.count || 0,
          distinct_employees: response.distinct_employees || 0,
        });

        // Handle different response formats
        let dataArray: any[] = [];
        if (Array.isArray(response)) {
          dataArray = response;
        } else if (response.data) {
          dataArray = Array.isArray(response.data) ? response.data : [response.data];
        } else if (response.PunchData) {
          dataArray = Array.isArray(response.PunchData) ? response.PunchData : [response.PunchData];
        } else if (typeof response === 'object' && response !== null) {
          if (response.Empcode || response.empcode) {
            dataArray = [response];
          }
        }

        const transformedData: MCIDData[] = dataArray.map((item: any) => ({
          name: item.Name || item.name || '',
          empcode: item.Empcode || item.empcode || '',
          punch_date: item.PunchDate || item.punch_date || '',
          punch_time: item.PunchTime || item.punch_time || '',
          m_flag: item.M_Flag || item.m_flag || '',
          mcid: item.mcid || '',
        }));

        setData(transformedData);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: any = await mcidDataApi.process(
        fromDate,
        toDate,
        empcode.trim() || undefined
      );

      if (response.error) {
        setError(response.error);
      } else {
        // Transform operational data to display format
        const employees = response.employees || [];
        const transformedData: any[] = employees.map((emp: any) => ({
          empcode: emp.empcode,
          name: emp.name,
          date: emp.date,
          in_time: emp.in_time,
          out_time: emp.out_time,
          total_time: emp.total_time,
          break_time: emp.break_time,
          work_time: emp.work_time,
          total_punches_count: emp.total_punches_count,
          invalid_punches_count: emp.invalid_punches_count,
        }));

        setData(transformedData);
        setFetchStats({
          total_employees: response.total_employees || 0,
          total_punches: response.total_punches || 0,
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    exportToPDF({
      title: 'MCID Data Report',
      filename: `mcid_data_${fromDate.replace(/\//g, '_')}_${toDate.replace(/\//g, '_')}.pdf`,
      dateRange: `Date Range: ${fromDate} to ${toDate}`,
      columns: [
        { header: 'Name', dataKey: 'name' },
        { header: 'Emp Code', dataKey: 'empcode' },
        { header: 'Punch Date', dataKey: 'punch_date' },
        { header: 'Punch Time', dataKey: 'punch_time' },
        { header: 'M Flag', dataKey: 'm_flag' },
        { header: 'MCID', dataKey: 'mcid' },
      ],
      data: data,
    });
  };

  const columns = [
    { key: 'empcode', header: 'Employee Code', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'punch_date', header: 'Punch Date', sortable: true },
    { key: 'punch_time', header: 'Punch Time', sortable: true },
    { key: 'mcid', header: 'MCID', sortable: true },
    { key: 'm_flag', header: 'M Flag', sortable: true },
  ];

  const processColumns = [
    { key: 'empcode', header: 'Employee Code', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'in_time', header: 'In Time', sortable: true },
    { key: 'out_time', header: 'Out Time', sortable: true },
    { key: 'total_time', header: 'Total Time', sortable: true },
    { key: 'break_time', header: 'Break Time', sortable: true },
    { key: 'work_time', header: 'Work Time', sortable: true },
    { key: 'total_punches_count', header: 'Total Punches', sortable: true },
    { key: 'invalid_punches_count', header: 'Invalid Punches', sortable: true },
  ];

  const displayColumns = data.length > 0 && data[0].hasOwnProperty('work_time') 
    ? processColumns 
    : columns;

  return (
    <div className="mcid-page">
      <div className="page-header">
        <h2>MCID Data</h2>
        <p>Fetch and process MCID punch data</p>
      </div>

      <div className="search-panel">
        <div className="search-form">
          <div className="form-group">
            <label>
              <Calendar size={16} />
              From Date (DD/MM/YYYY)
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
              To Date (DD/MM/YYYY)
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>
              <Search size={16} />
              Employee Code (Optional)
            </label>
            <input
              type="text"
              placeholder="For processing only"
              value={empcode}
              onChange={(e) => setEmpcode(e.target.value)}
            />
          </div>
          <div className="button-group">
            <button className="fetch-btn" onClick={handleFetch} disabled={loading}>
              <RefreshCw size={16} />
              Fetch Data
            </button>
            <button className="process-btn" onClick={handleProcess} disabled={loading}>
              <Download size={16} />
              Process Data
            </button>
          </div>
        </div>
      </div>

      {fetchStats && (
        <div className="stats-panel">
          <div className="stat-item">
            <span className="stat-label">Saved:</span>
            <span className="stat-value">{fetchStats.saved_count || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Already Exists:</span>
            <span className="stat-value">{fetchStats.already_similar_count || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Records:</span>
            <span className="stat-value">{fetchStats.count || fetchStats.total_punches || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Employees:</span>
            <span className="stat-value">{fetchStats.distinct_employees || fetchStats.total_employees || 0}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {data.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <span className="results-count">{data.length} records found</span>
          </div>
          <DataTable
            data={data}
            columns={displayColumns}
            loading={loading}
            onExport={handleExport}
            searchable={true}
            searchKeys={['empcode', 'name']}
          />
        </div>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="empty-state">
          <Calendar size={48} />
          <p>Enter dates and click Fetch Data or Process Data to view MCID data</p>
        </div>
      )}
    </div>
  );
}

