import { Search, Bell, Globe, Moon, Sun, Menu, Zap } from 'lucide-react';

const TopNav = ({ onMenuClick }) => {
  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <Zap size={20} fill="var(--primary)" color="var(--primary)" />
          <span className="brand-name">ALMA</span>
        </div>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Rechercher..." />
        </div>
      </div>

      <div className="top-nav-actions">
        <div className="status-indicator">
          <span className="dot"></span>
          <span className="status-text">Statut Système:</span>
          <span className="status-value">Opérationnel</span>
        </div>

        <div className="divider" />

        <button className="action-btn">
          <Globe size={18} />
          <span>FR</span>
        </button>

        <button className="action-btn">
          <Moon size={18} />
        </button>

        <button className="notification-btn">
          <Bell size={18} />
          <span className="badge">3</span>
        </button>
      </div>

      <style jsx>{`
        .top-nav {
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-xl);
          background: var(--bg-dark);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          z-index: 90;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .top-nav-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-white);
          cursor: pointer;
          padding: 8px;
        }

        .mobile-logo {
          display: none;
          align-items: center;
          gap: 6px;
        }

        .mobile-logo .brand-name {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
        }

        @media (max-width: 1024px) {
          .top-nav { padding: 0 var(--spacing-md); }
          .mobile-menu-btn { display: block; }
          .mobile-logo { display: flex; }
          .search-bar { display: none; }
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 10px var(--spacing-sm);
          border-radius: var(--radius-md);
          width: 450px;
          transition: var(--transition);
        }

        .search-bar:focus-within {
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 15px rgba(243, 156, 18, 0.1);
        }

        .search-icon {
          color: var(--text-gray);
          opacity: 0.5;
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: var(--text-white);
          width: 100%;
          outline: none;
          font-size: 0.95rem;
          font-family: 'Inter', sans-serif;
        }

        .search-bar input::placeholder {
            color: var(--text-gray);
            opacity: 0.4;
        }

        .top-nav-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.8rem;
          background: rgba(39, 174, 96, 0.08);
          padding: 6px 14px;
          border-radius: 100px;
          border: 1px solid rgba(39, 174, 96, 0.2);
          margin-right: var(--spacing-sm);
        }

        .status-text {
            color: var(--text-gray);
            opacity: 0.7;
        }

        .status-value {
            color: var(--success);
            font-weight: 600;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--success);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }

        .divider {
            width: 1px;
            height: 24px;
            background: rgba(255, 255, 255, 0.1);
            margin: 0 var(--spacing-sm);
        }

        .action-btn, .notification-btn {
          background: transparent;
          border: none;
          color: var(--text-gray);
          cursor: pointer;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          transition: var(--transition);
        }

        .action-btn:hover, .notification-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--primary);
        }

        .notification-btn {
          position: relative;
        }

        .notification-btn .badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 18px;
          height: 18px;
          background: var(--error);
          color: white;
          font-size: 10px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          border: 2px solid var(--bg-dark);
          box-shadow: 0 0 10px rgba(231, 76, 60, 0.3);
        }

        .action-btn span {
          margin-left: var(--spacing-xs);
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
        }

        @media (max-width: 1024px) {
            .search-bar { width: 300px; }
            .status-indicator { display: none; }
        }
      `}</style>
    </header>
  );
};

export default TopNav;
