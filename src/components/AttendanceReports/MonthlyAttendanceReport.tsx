import type { AllData } from '../../types';
import './AttendanceReports.css';

interface MonthlyAttendanceReportProps {
  data: AllData[];
  employeeName: string;
  empcode: string;
  departmentName?: string;
  companyName?: string;
  fromDate: string;
  toDate: string;
}

interface DayData {
  date: string;
  day: string;
  inTime: string;
  outTime: string;
  workDuration: string;
  breakDuration: string;
  otDuration: string;
  status: string;
}

interface SummaryStats {
  present: number;
  wo: number; // Weekly Off
  hl: number; // Holiday
  lv: number; // Leave
  absent: number;
  totalWorkOT: string; // Total Work + OT in HH:MM format
  totalOT: string; // Total OT in HH:MM format
}

// Helper function to add time durations (HH:MM format)
function addTimeDurations(time1: string, time2: string): string {
  const parseTime = (time: string): number => {
    if (!time || time === '--:--' || time === '00:00') return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const totalMinutes = parseTime(time1) + parseTime(time2);
  return formatTime(totalMinutes);
}

// Helper function to get day name from date string
function getDayName(dateString: string): string {
  try {
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  } catch {
    return '';
  }
}

export default function MonthlyAttendanceReport({
  data,
  employeeName,
  empcode,
  departmentName = 'Default',
  companyName = 'Orange Data Tech Private Limited',
  fromDate,
  toDate,
}: MonthlyAttendanceReportProps) {
  // Process data into daily records
  const dailyData: DayData[] = data.map((item) => ({
    date: item.date_string || '',
    day: getDayName(item.date_string || ''),
    inTime: item.in_time || '--:--',
    outTime: item.out_time || '--:--',
    workDuration: item.work_time || '00:00',
    breakDuration: item.break_time || '00:00',
    otDuration: item.over_time || '00:00',
    status: item.status || 'A',
  }));

  // Calculate summary statistics
  const stats: SummaryStats = {
    present: dailyData.filter((d) => d.status === 'P').length,
    wo: dailyData.filter((d) => d.status === 'WO').length,
    hl: dailyData.filter((d) => d.status === 'HL').length,
    lv: dailyData.filter((d) => d.status === 'LV').length,
    absent: dailyData.filter((d) => d.status === 'A').length,
    totalWorkOT: dailyData.reduce((acc, d) => {
      const workOT = addTimeDurations(d.workDuration, d.otDuration);
      return addTimeDurations(acc, workOT);
    }, '00:00'),
    totalOT: dailyData.reduce((acc, d) => addTimeDurations(acc, d.otDuration), '00:00'),
  };

  return (
    <div className="monthly-attendance-report">
      <div className="report-header">
        <div className="report-title">Attendance Report</div>
        <div className="report-info">
          <div className="info-row">
            <span className="info-label">Department Name:</span>
            <span className="info-value">{departmentName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Employee Code (Empcode):</span>
            <span className="info-value">{empcode}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Employee Name:</span>
            <span className="info-value">{employeeName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Company Name (CompName):</span>
            <span className="info-value">{companyName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Report Month/Period:</span>
            <span className="info-value">{fromDate} - {toDate}</span>
          </div>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-title">Summary Statistics</div>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Present</span>
            <span className="summary-value">{stats.present}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">WO (Weekly Off)</span>
            <span className="summary-value">{stats.wo}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">HL (Holiday)</span>
            <span className="summary-value">{stats.hl}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">LV (Leave)</span>
            <span className="summary-value">{stats.lv}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Absent</span>
            <span className="summary-value">{stats.absent}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Work + OT (Tot.Work+OT)</span>
            <span className="summary-value">{stats.totalWorkOT}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Overtime (Total OT)</span>
            <span className="summary-value">{stats.totalOT}</span>
          </div>
        </div>
      </div>

      <div className="daily-breakdown-section">
        <div className="breakdown-title">Daily Attendance Breakdown</div>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>IN Time</th>
              <th>OUT Time</th>
              <th>WORK Duration (HH:MM)</th>
              <th>Break Duration (HH:MM)</th>
              <th>OT Duration (HH:MM)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dailyData.map((day, index) => (
              <tr key={index}>
                <td>{day.date}</td>
                <td>{day.day}</td>
                <td className={day.inTime === '--:--' ? 'missing-time' : ''}>{day.inTime}</td>
                <td className={day.outTime === '--:--' ? 'missing-time' : ''}>{day.outTime}</td>
                <td>{day.workDuration}</td>
                <td>{day.breakDuration}</td>
                <td>{day.otDuration}</td>
                <td>
                  <span className={`status-badge status-${day.status.toLowerCase()}`}>
                    {day.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

