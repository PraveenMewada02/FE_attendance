import React from 'react';
import type { AllData } from '../../types';
import './AttendanceReports.css';

interface DailyPunchReportProps {
  data: AllData[];
  companyName?: string;
  reportDate: string;
}

interface PunchRecord {
  empcode: string;
  name: string;
  shift?: string;
  inTime: string;
  punches: string[]; // Array of punch times: [Out1, In2, Out2, In3, Out3, ...]
  outTime: string;
  workOT: string;
  ot: string;
  break: string;
}

export default function DailyPunchReport({
  data,
  companyName = 'Orange Data Tech Private Limited',
  reportDate,
}: DailyPunchReportProps) {
  // Group data by employee for the day
  const employeeMap = new Map<string, PunchRecord>();

  data.forEach((item: any) => {
    const key = item.empcode;
    if (!employeeMap.has(key)) {
      // Extract detailed punches if available in API response
      // Order: Out1, In2, Out2, In3, Out3, In4, Out4, In5, Out5, In6, Out6, In7, Out7, In8
      const punchFields = [
        ['Out1', 'out1', 'Out_1', 'out_1'],
        ['In2', 'in2', 'In_2', 'in_2'],
        ['Out2', 'out2', 'Out_2', 'out_2'],
        ['In3', 'in3', 'In_3', 'in_3'],
        ['Out3', 'out3', 'Out_3', 'out_3'],
        ['In4', 'in4', 'In_4', 'in_4'],
        ['Out4', 'out4', 'Out_4', 'out_4'],
        ['In5', 'in5', 'In_5', 'in_5'],
        ['Out5', 'out5', 'Out_5', 'out_5'],
        ['In6', 'in6', 'In_6', 'in_6'],
        ['Out6', 'out6', 'Out_6', 'out_6'],
        ['In7', 'in7', 'In_7', 'in_7'],
        ['Out7', 'out7', 'Out_7', 'out_7'],
        ['In8', 'in8', 'In_8', 'in_8'],
      ];

      const punches: string[] = [];
      punchFields.forEach((fieldVariations) => {
        let found = false;
        for (const fieldName of fieldVariations) {
          if (item[fieldName] && item[fieldName] !== '--:--' && item[fieldName] !== '') {
            punches.push(item[fieldName]);
            found = true;
            break;
          }
        }
        if (!found) {
          punches.push(''); // Empty if not found
        }
      });

      employeeMap.set(key, {
        empcode: item.empcode,
        name: item.name,
        shift: item.Shift || item.shift || 'G', // Get shift from API if available
        inTime: item.in_time || item.INTime || '--:--',
        punches: punches,
        outTime: item.out_time || item.OUTTime || '--:--',
        workOT: item.work_time || item.WorkTime || '00:00',
        ot: item.over_time || item.OverTime || '00:00',
        break: item.break_time || item.BreakTime || '00:00',
      });
    }
  });

  const records = Array.from(employeeMap.values());

  // If API provides detailed punch data, we can parse it here
  // For now, we'll show the structure ready for detailed punch data
  // The API response might need to include fields like: Out1, In2, Out2, In3, Out3, etc.

  return (
    <div className="daily-punch-report">
      <div className="report-header">
        <div className="report-title">Daily IN/OUT Report</div>
        <div className="report-info">
          <div className="info-row">
            <span className="info-label">Date:</span>
            <span className="info-value">{reportDate}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Company Name:</span>
            <span className="info-value">{companyName}</span>
          </div>
        </div>
      </div>

      <div className="punch-table-section">
        <table className="punch-table">
          <thead>
            <tr>
              <th rowSpan={2}>Dept. Name</th>
              <th rowSpan={2}>Empcode</th>
              <th rowSpan={2}>Name</th>
              <th rowSpan={2}>Shift</th>
              <th rowSpan={2}>INTime</th>
              <th>Out1</th>
              <th>In2</th>
              <th>Out2</th>
              <th>In3</th>
              <th>Out3</th>
              <th>In4</th>
              <th>Out4</th>
              <th>In5</th>
              <th>Out5</th>
              <th>In6</th>
              <th>Out6</th>
              <th>In7</th>
              <th>Out7</th>
              <th>In8</th>
              <th rowSpan={2}>OUTTime</th>
              <th rowSpan={2}>Work+OT</th>
              <th rowSpan={2}>OT</th>
              <th rowSpan={2}>Break</th>
            </tr>
            <tr>
              {/* Empty row for rowspan alignment */}
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              // Use punches from record, or fill with empty strings
              const punches = record.punches.length > 0 
                ? record.punches 
                : Array(14).fill(''); // 14 punch slots (Out1-In8)

              return (
                <tr key={index}>
                  <td>Default</td>
                  <td>{record.empcode}</td>
                  <td>{record.name}</td>
                  <td>{record.shift || 'G'}</td>
                  <td className={record.inTime === '--:--' ? 'missing-time' : ''}>
                    {record.inTime}
                  </td>
                  {punches.map((punch, punchIndex) => (
                    <td key={punchIndex} className={!punch ? 'empty-punch' : ''}>
                      {punch || ''}
                    </td>
                  ))}
                  <td className={record.outTime === '--:--' ? 'missing-time' : ''}>
                    {record.outTime}
                  </td>
                  <td>{record.workOT}</td>
                  <td>{record.ot}</td>
                  <td>{record.break}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

