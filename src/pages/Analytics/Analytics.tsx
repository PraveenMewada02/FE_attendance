import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { allDataApi } from '../../services/api';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Analytics.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'dd/MM/yyyy'));
  const [toDate, setToDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [attendanceByDate, setAttendanceByDate] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [employeeAttendance, setEmployeeAttendance] = useState<any[]>([]);
  const [workTimeDistribution, setWorkTimeDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    if (!fromDate || !toDate) return;

    setLoading(true);
    try {
      const response: any = await allDataApi.search(fromDate, toDate);
      
      // Check for Error field in response
      if (response.Error === true || response.error) {
        console.error('Error:', response.Msg || response.error);
        return;
      }

      // Handle the InOutPunchData response format
      let data: any[] = [];
      if (response.InOutPunchData) {
        data = Array.isArray(response.InOutPunchData) ? response.InOutPunchData : [response.InOutPunchData];
      } else if (Array.isArray(response)) {
        data = response;
      } else if (response.data) {
        data = Array.isArray(response.data) ? response.data : [response.data];
      } else if (response.PunchData) {
        data = Array.isArray(response.PunchData) ? response.PunchData : [response.PunchData];
      } else if (typeof response === 'object' && response !== null && (response.Empcode || response.empcode)) {
        data = [response];
      }

      if (data.length === 0) {
        console.warn('No data received from API');
        return;
      }

      // Attendance by date
      const attendanceByDateMap: Record<string, number> = {};
      data.forEach((item: any) => {
        const dateStr = item.DateString || item.date_string || item.Date;
        if (dateStr) {
          const date = dateStr.split(' ')[0];
          attendanceByDateMap[date] = (attendanceByDateMap[date] || 0) + 1;
        }
      });

      const attendanceData = Object.entries(attendanceByDateMap)
        .map(([date, count]) => {
          // Handle DD/MM/YYYY format
          const [day, month, year] = date.split('/');
          const dateObj = new Date(`${year}-${month}-${day}`);
          return {
            date: format(dateObj, 'MMM dd'),
            attendance: count,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      setAttendanceByDate(attendanceData);

      // Status distribution
      const statusMap: Record<string, number> = {};
      data.forEach((item: any) => {
        const status = item.Status || item.status || 'Unknown';
        statusMap[status] = (statusMap[status] || 0) + 1;
      });

      const statusData = Object.entries(statusMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setStatusDistribution(statusData);

      // Top employees by attendance (using Name if available, otherwise Empcode)
      const employeeMap: Record<string, { count: number; name: string }> = {};
      data.forEach((item: any) => {
        const empcode = item.Empcode || item.empcode || 'Unknown';
        const name = item.Name || item.name || empcode;
        if (!employeeMap[empcode]) {
          employeeMap[empcode] = { count: 0, name };
        }
        employeeMap[empcode].count += 1;
      });

      const employeeData = Object.entries(employeeMap)
        .map(([empcode, info]) => ({ 
          empcode, 
          name: info.name,
          count: info.count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setEmployeeAttendance(employeeData);

      // Work time distribution
      const workTimeMap: Record<string, number> = {};
      data.forEach((item: any) => {
        const wt = item.WorkTime || item.work_time || '0:00';
        const [hours, minutes] = wt.split(':').map(Number);
        const totalHours = hours + (minutes / 60);
        const range = `${Math.floor(totalHours / 2) * 2}-${Math.floor(totalHours / 2) * 2 + 2}h`;
        workTimeMap[range] = (workTimeMap[range] || 0) + 1;
      });

      const workTimeData = Object.entries(workTimeMap)
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => a.range.localeCompare(b.range));

      setWorkTimeDistribution(workTimeData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h2>Analytics</h2>
        <p>View detailed analytics and insights</p>
      </div>

      <div className="date-filter">
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
        <button className="search-btn" onClick={loadAnalytics} disabled={loading}>
          {loading ? 'Loading...' : 'Load Analytics'}
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      ) : (
        <div className="charts-container">
          <div className="chart-card">
            <h3>
              <TrendingUp size={20} />
              Attendance Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>
              <BarChart3 size={20} />
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>
              <BarChart3 size={20} />
              Top 10 Employees by Attendance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeAttendance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: any) => [value, 'Attendance Count']}
                  labelFormatter={(label) => `Employee: ${label}`}
                />
                <Legend />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>
              <BarChart3 size={20} />
              Work Time Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workTimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

