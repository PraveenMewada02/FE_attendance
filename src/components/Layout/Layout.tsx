import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, FileText, BarChart3, UserSearch, Database } from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/attendance', label: 'Attendance Data', icon: Clock },
    { path: '/stored-attendance', label: 'Stored Attendance', icon: Database },
    { path: '/employee-search', label: 'Employee Search', icon: UserSearch },
    { path: '/mcid', label: 'MCID Data', icon: Users },
    { path: '/files', label: 'Files', icon: FileText },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Attendance System</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <h2>{navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}</h2>
        </header>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}

