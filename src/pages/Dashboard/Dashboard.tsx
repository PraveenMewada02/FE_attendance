import { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { allDataApi } from '../../services/api';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [attendanceChart, setAttendanceChart] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const extractDataFromResponse = (response: any): any[] => {
    let data: any[] = [];
    
    // Check for InOutPunchData (the actual API response structure)
    if (response.InOutPunchData) {
      data = Array.isArray(response.InOutPunchData) ? response.InOutPunchData : [response.InOutPunchData];
    }
    // If response is directly an array
    else if (Array.isArray(response)) {
      data = response;
    }
    // If response has a data property
    else if (response.data) {
      data = Array.isArray(response.data) ? response.data : [response.data];
    }
    // If response is an object with nested data
    else if (response.PunchData) {
      data = Array.isArray(response.PunchData) ? response.PunchData : [response.PunchData];
    }
    // If response is a single object, wrap it in array
    else if (typeof response === 'object' && response !== null) {
      // Check if it looks like a data record
      if (response.Empcode || response.empcode) {
        data = [response];
      }
    }
    
    return data;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'dd/MM/yyyy');
      const weekAgo = format(subDays(new Date(), 6), 'dd/MM/yyyy'); // Last 7 days (including today)

      // Fetch today's data for current stats
      const todayResponse = await allDataApi.search(today, today);
      const todayData = extractDataFromResponse(todayResponse);

      // Fetch last 7 days data for trend chart
      const trendResponse = await allDataApi.search(weekAgo, today);
      const trendData = extractDataFromResponse(trendResponse);

      console.log('Today data:', todayData);
      console.log('Trend data:', trendData);

      // Calculate today's statistics
      if (todayData.length > 0) {
        const presentCount = todayData.filter((item: any) => {
          const status = item.Status || item.status || '';
          return status === 'P';
        }).length;

        const absentCount = todayData.filter((item: any) => {
          const status = item.Status || item.status || '';
          return status === 'A';
        }).length;

        const lateCount = todayData.filter((item: any) => {
          const lateIn = item.Late_In || item.late_in || '00:00';
          return lateIn !== '00:00' && lateIn !== '' && lateIn !== '--:--';
        }).length;

        const uniqueEmployees = new Set(todayData.map((item: any) => item.Empcode || item.empcode)).size;

        setStats({
          totalEmployees: uniqueEmployees,
          presentCount,
          absentCount,
          lateCount,
        });
      }

      // Prepare 7-day trend chart data
      if (trendData.length > 0) {
        const attendanceByDate: Record<string, { present: number; absent: number; total: number }> = {};
        
        // Initialize all 7 days with zeros
        for (let i = 6; i >= 0; i--) {
          const date = format(subDays(new Date(), i), 'dd/MM/yyyy');
          attendanceByDate[date] = { present: 0, absent: 0, total: 0 };
        }

        // Count attendance by date
        trendData.forEach((item: any) => {
          const dateStr = item.DateString || item.date_string || item.Date;
          if (dateStr) {
            const date = dateStr.split(' ')[0]; // Get date part (DD/MM/YYYY)
            if (attendanceByDate[date]) {
              const status = item.Status || item.status || '';
              if (status === 'P') {
                attendanceByDate[date].present++;
              } else if (status === 'A') {
                attendanceByDate[date].absent++;
              }
              attendanceByDate[date].total++;
            }
          }
        });

        // Convert to chart format
        const chartData = Object.entries(attendanceByDate)
          .map(([date, counts]) => {
            const dateObj = new Date(date.split('/').reverse().join('-'));
            return {
              date: format(dateObj, 'MMM dd'),
              fullDate: date,
              present: counts.present,
              absent: counts.absent,
              total: counts.total,
            };
          })
          .sort((a, b) => a.fullDate.localeCompare(b.fullDate));

        setAttendanceChart(chartData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: '#3b82f6',
    },
    {
      title: 'Present Today',
      value: stats.presentCount,
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      title: 'Absent Today',
      value: stats.absentCount,
      icon: XCircle,
      color: '#ef4444',
    },
    {
      title: 'Late Arrivals',
      value: stats.lateCount,
      icon: AlertCircle,
      color: '#f59e0b',
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="stat-card">
              <div className="stat-card-icon" style={{ backgroundColor: `${card.color}20` }}>
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <div className="stat-card-content">
                <h3>{card.value}</h3>
                <p>{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Attendance Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={attendanceChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                formatter={(value: any, name: string) => {
                  if (name === 'present') return [value, 'Present'];
                  if (name === 'absent') return [value, 'Absent'];
                  return [value, name];
                }}
              />
              <Legend 
                formatter={(value: string) => {
                  if (value === 'present') return 'Present';
                  if (value === 'absent') return 'Absent';
                  return value;
                }}
              />
              <Bar dataKey="present" stackId="a" fill="#10b981" name="present" />
              <Bar dataKey="absent" stackId="a" fill="#ef4444" name="absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Daily Attendance Overview (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={attendanceChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="present" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Present"
                dot={{ fill: '#10b981', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="absent" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Absent"
                dot={{ fill: '#ef4444', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

