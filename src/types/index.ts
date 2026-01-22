export interface AllData {
  id?: number;
  empcode: string;
  in_time: string;
  out_time: string;
  work_time: string;
  over_time: string;
  break_time: string;
  status: string;
  date_string: string;
  remark: string;
  erl_out: string;
  late_in: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface MCIDData {
  id?: number;
  name: string;
  empcode: string;
  punch_date: string;
  punch_time: string;
  m_flag?: string;
  mcid: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id?: number;
  empcode: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OperationalData {
  id?: number;
  empcode: string;
  name: string;
  date: string;
  in_time?: string;
  out_time?: string;
  total_time: string;
  break_time: string;
  work_time: string;
  total_punches_count: number;
  invalid_punches_count: number;
}

export interface PunchDataFile {
  id: number;
  filename: string;
  file_path: string;
  blob_url: string;
  blob_name?: string;
  container_name?: string;
  from_date: string;
  to_date: string;
  total_records: number;
  unique_employees: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
  total_count?: number;
  returned_count?: number;
  offset?: number;
}

export interface DashboardStats {
  totalEmployees: number;
  totalRecords: number;
  todayAttendance: number;
  averageWorkTime: string;
}

export interface InOutPunchDataItem {
  Empcode: string;
  INTime: string;
  OUTTime: string;
  WorkTime: string;
  OverTime: string;
  BreakTime: string;
  Status: string;
  DateString: string;
  Remark: string;
  Erl_Out: string;
  Late_In: string;
  Name: string;
}

export interface AnalyticsResponse {
  InOutPunchData: InOutPunchDataItem[];
  Error: boolean;
  Msg: string;
  IsAdmin: boolean;
}

