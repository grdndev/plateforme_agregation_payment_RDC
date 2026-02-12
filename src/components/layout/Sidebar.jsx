import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Users,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ChevronRight,
  Zap
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', path: '/' },
    { icon: <ArrowLeftRight size={20} />, label: 'Transactions', path: '/transactions' },
    { icon: <Wallet size={20} />, label: 'Virements', path: '/virements' },
    { icon: <ShieldCheck size={20} />, label: 'Conformité', path: '/compliance' },
    { icon: <Settings size={20} />, label: 'Intégration API', path: '/integration' },
    { icon: <Users size={20} />, label: 'Collaborateurs', path: '/collaborateurs' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="logo-container">
          <Zap size={24} fill="var(--primary)" color="var(--primary)" className="logo-icon" />
        </div>
        <div className="brand-info">
          <span className="brand-name">ALMA</span>
          <span className="brand-tagline">RDC</span>
        </div>
        <button className="mobile-close" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">Menu Principal</p>
        <div className="nav-list">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
              {item.path === '/' && <ChevronRight size={14} className="arrow" />}
            </NavLink>
          ))}
        </div>

        <p className="nav-label mt-4">Administration</p>
        <div className="nav-list">
          <NavLink to="/admin" className="nav-item">
            <span className="icon"><ShieldCheck size={20} /></span>
            <span className="label">Dashboard Admin</span>
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">JD</div>
          <div className="details">
            <p className="name">Jean Dupont</p>
            <p className="role">Propriétaire</p>
          </div>
        </div>
        <button className="logout-btn" title="Déconnexion">
          <LogOut size={18} />
        </button>
      </div>

      <style jsx>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          background: var(--bg-deeper);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          padding: var(--spacing-md);
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 1024px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 20px 0 50px rgba(0, 0, 0, 0.5);
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }

        @media (min-width: 1025px) {
          .sidebar {
            position: sticky;
            transform: none;
          }
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xl);
          padding: 0 var(--spacing-xs);
        }

        .logo-container {
          width: 44px;
          height: 44px;
          background: rgba(243, 156, 18, 0.1);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(243, 156, 18, 0.1);
        }

        .brand-info {
            display: flex;
            flex-direction: column;
        }

        .brand-name {
          font-family: 'Poppins', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1;
          color: var(--text-white);
          letter-spacing: -0.02em;
        }

        .brand-tagline {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--primary);
            letter-spacing: 0.2em;
        }

        .mobile-close {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-white);
          cursor: pointer;
          margin-left: auto;
        }

        @media (max-width: 1024px) {
          .mobile-close { display: block; }
        }

        .nav-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-gray);
          opacity: 0.5;
          margin-bottom: var(--spacing-sm);
          padding-left: var(--spacing-xs);
        }

        .nav-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: 12px var(--spacing-sm);
          border-radius: var(--radius-md);
          color: var(--text-gray);
          text-decoration: none;
          transition: var(--transition);
          font-weight: 500;
          font-size: 0.95rem;
        }

        .nav-item:hover {
          color: var(--text-white);
          background: rgba(255, 255, 255, 0.03);
          transform: translateX(4px);
        }

        .nav-item.active {
          background: rgba(243, 156, 18, 0.1);
          color: var(--primary);
          border-right: 3px solid var(--primary);
        }

        .nav-item.active .icon {
          color: var(--primary);
        }

        .arrow {
          margin-left: auto;
          opacity: 0.5;
        }

        .mt-4 { margin-top: 2rem; }

        .sidebar-footer {
          margin-top: auto;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-lg);
          padding: var(--spacing-sm);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .name {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-white);
        }

        .role {
          font-size: 0.75rem;
          color: var(--text-gray);
          opacity: 0.7;
          margin: 0;
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: var(--text-gray);
          opacity: 0.5;
          cursor: pointer;
          transition: var(--transition);
          padding: 8px;
        }

        .logout-btn:hover {
          color: var(--error);
          opacity: 1;
          transform: scale(1.1);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
