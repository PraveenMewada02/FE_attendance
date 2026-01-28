import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Attendance from './pages/Attendance/Attendance';
import StoredAttendance from './pages/StoredAttendance/StoredAttendance';
import MCID from './pages/MCID/MCID';
import Files from './pages/Files/Files';
import Analytics from './pages/Analytics/Analytics';
import EmployeeSearch from './pages/EmployeeSearch/EmployeeSearch';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/stored-attendance" element={<StoredAttendance />} />
          <Route path="/employee-search" element={<EmployeeSearch />} />
          <Route path="/mcid" element={<MCID />} />
          <Route path="/files" element={<Files />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
