import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle, XCircle, X, RefreshCw } from 'lucide-react';
import { allDataApi } from '../../services/api';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { AllData } from '../../types';
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
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AllData[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [todayData, setTodayData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  
  // Track if it's the first load of the entire app
  const isFirstLoad = useRef(true);
  // Track previous location to detect navigation
  const prevLocation = useRef<string>('');
  // Track if tab was hidden (for visibility API)
  const wasTabHidden = useRef(false);
  // Track last visibility change time to prevent rapid refreshes
  const lastVisibilityChange = useRef<number>(0);

  // Load data on first mount (when site is opened for the first time)
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      prevLocation.current = location.pathname;
      loadDashboardData();
    }
  }, []);

  // Track location changes (internal navigation)
  useEffect(() => {
    // If location changed and we're on dashboard, it's internal navigation
    if (prevLocation.current !== location.pathname && location.pathname === '/') {
      // User navigated back to dashboard - don't auto-refresh
      prevLocation.current = location.pathname;
      // Don't refresh, just update the location
      return;
    }
    prevLocation.current = location.pathname;
  }, [location]);

  // Handle page visibility changes (tab becomes active when site is open)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab became hidden
        wasTabHidden.current = true;
      } else if (document.visibilityState === 'visible') {
        // Tab became visible
        // Only refresh if:
        // 1. Tab was previously hidden (not just internal navigation)
        // 2. We're on the dashboard
        // 3. At least 5 seconds have passed since last visibility change
        if (wasTabHidden.current && location.pathname === '/') {
          const now = Date.now();
          if (now - lastVisibilityChange.current > 5000) {
            lastVisibilityChange.current = now;
            loadDashboardData();
          }
        }
        wasTabHidden.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

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

  const loadDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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
        
        // Store today's data for detail views
        setTodayData(todayData);
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
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  const handleCardClick = async (cardType: string) => {
    setSelectedCard(cardType);
    setDetailLoading(true);
    
    try {
      const today = format(new Date(), 'dd/MM/yyyy');
      let response: any;
      
      // Fetch today's data if not already loaded
      let data = todayData;
      if (data.length === 0) {
        response = await allDataApi.search(today, today);
        data = extractDataFromResponse(response);
      }
      
      // Filter data based on card type
      let filteredData: any[] = [];
      
      switch (cardType) {
        case 'total':
          // Show all unique employees
          const uniqueEmployeesMap = new Map();
          data.forEach((item: any) => {
            const empcode = item.Empcode || item.empcode;
            if (empcode && !uniqueEmployeesMap.has(empcode)) {
              uniqueEmployeesMap.set(empcode, item);
            }
          });
          filteredData = Array.from(uniqueEmployeesMap.values());
          break;
          
        case 'present':
          filteredData = data.filter((item: any) => {
            const status = item.Status || item.status || '';
            return status === 'P';
          });
          break;
          
        case 'absent':
          filteredData = data.filter((item: any) => {
            const status = item.Status || item.status || '';
            return status === 'A';
          });
          break;
          
        case 'late':
          filteredData = data.filter((item: any) => {
            const lateIn = item.Late_In || item.late_in || '00:00';
            return lateIn !== '00:00' && lateIn !== '' && lateIn !== '--:--';
          });
          break;
      }
      
      // Transform to AllData format
      const transformedData: AllData[] = filteredData.map((item: any) => ({
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
      
      setDetailData(transformedData);
    } catch (error) {
      console.error('Error loading detail data:', error);
      setDetailData([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const statCards = [
    {
      id: 'total',
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: '#3b82f6',
    },
    {
      id: 'present',
      title: 'Present Today',
      value: stats.presentCount,
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      id: 'absent',
      title: 'Absent Today',
      value: stats.absentCount,
      icon: XCircle,
      color: '#ef4444',
    },
    {
      id: 'late',
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
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Dashboard</h2>
          <p className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <button 
          className="refresh-btn"
          onClick={handleManualRefresh}
          disabled={isRefreshing || loading}
          title="Refresh Dashboard"
        >
          <RefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className="stat-card clickable"
              onClick={() => handleCardClick(card.id)}
            >
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

      {/* Detail Modal */}
      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {statCards.find(c => c.id === selectedCard)?.title || 'Details'}
              </h2>
              <button 
                className="modal-close" 
                onClick={() => setSelectedCard(null)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {detailLoading ? (
                <div className="detail-loading">
                  <div className="spinner"></div>
                  <p>Loading details...</p>
                </div>
              ) : detailData.length === 0 ? (
                <div className="detail-empty">
                  <p>No data available</p>
                </div>
              ) : (
                <div className="detail-table-container">
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Emp Code</th>
                        <th>Name</th>
                        <th>In Time</th>
                        <th>Out Time</th>
                        <th>Work Time</th>
                        <th>Late In</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((item, index) => (
                        <tr key={`${item.empcode}-${index}`}>
                          <td>{item.empcode}</td>
                          <td>{item.name}</td>
                          <td className={item.in_time === '--:--' ? 'time-missing' : ''}>
                            {item.in_time}
                          </td>
                          <td className={item.out_time === '--:--' ? 'time-missing' : ''}>
                            {item.out_time}
                          </td>
                          <td>{item.work_time}</td>
                          <td className={item.late_in !== '00:00' ? 'time-late' : ''}>
                            {item.late_in}
                          </td>
                          <td>
                            <span className={`status-badge ${
                              item.status === 'P' ? 'status-present' : 
                              item.status === 'A' ? 'status-absent' : 
                              'status-other'
                            }`}>
                              {item.status === 'P' ? 'Present' : 
                               item.status === 'A' ? 'Absent' : 
                               item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="detail-summary">
                    <p>Total Records: <strong>{detailData.length}</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

