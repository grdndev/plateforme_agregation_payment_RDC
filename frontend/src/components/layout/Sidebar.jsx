import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Users,
  Settings,
  ShieldCheck, LogOut,
  ChevronRight,
  Zap
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleName } from '../../utils/enums';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tableau de bord', path: '/merchant' },
    { icon: <ArrowLeftRight size={20} />, label: 'Transactions', path: '/transactions' },
    { icon: <Wallet size={20} />, label: 'Virements', path: '/virements' },
    { icon: <ShieldCheck size={20} />, label: 'Conformité', path: '/compliance' },
    { icon: <Settings size={20} />, label: 'Intégration API', path: '/integration' },
    { icon: <Users size={20} />, label: 'Collaborateurs', path: '/collaborateurs' },
  ];

  const isAdmin = ['admin', 'super_admin'].includes(user.role);

  return (
    <aside className={`w-2xs h-screen bg-deeper border-r-1 border-white/5 flex flex-col p-5 fixed left-0 top-0 z-10 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky`}>
      <div className="flex items-center gap-4 mb-6 px-3">
        <div className="w-11 h-11 bg-primary/10 border border-glass-border rounded-md flex items-center justify-center shadow-spread shadow-glass-border/50">
          <Zap size={24} className="text-primary" fill="currentColor"/>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">ALMA</span>
          <span className="text-xs font-bold text-primary tracking-widest">RDC</span>
        </div>
        <button
          className="ml-auto bg-transparent border-none text-white cursor-pointer block lg:hidden"
          onClick={onClose}
        >
          <X size={24} />
        </button>
      </div>

      <nav className="my-4 flex flex-col gap-3">
        {!isAdmin && <div>
          <p className="text-md uppercase tracking-wider text-gray-500 opacity-50">Menu Principal</p>
          <div className="flex flex-col gap-1 px-xs">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex gap-3 p-3 items-center rounded-md font-medium transition-all duration-200
                  ${isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'hover:bg-white/3 text-gray-400 hover:text-white'}`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.path === '/' && <ChevronRight size={14} className="arrow" />}
              </NavLink>
            ))}
          </div>
        </div>}
        {isAdmin && <div>
          <p className="text-md uppercase tracking-wider text-gray-500 opacity-50">Administration</p>
          <div className="flex flex-col gap-1 px-xs">
            <NavLink to="/admin" className={({ isActive }) =>
                  `flex gap-3 p-3 items-center rounded-md font-medium transition-all duration-200
                  ${isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'hover:bg-white/3 text-gray-400 hover:text-white'}`
                }>
              <ShieldCheck size={20} />
              <span>Dashboard Admin</span>
            </NavLink>
          </div>
        </div>}
      </nav>

      <div className="mt-auto bg-white/2 border border-white/5 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-md">JD</div>
          <div>
            <p className="text-sm font-semibold text-white m-0">{user?.firstname ?? "-"} {user?.lastname ?? "-"}</p>
            <p className="text-xs text-gray-500 opacity-70 m-0">{getRoleName(user?.role ?? "")}</p>
          </div>
        </div>
        <button
          className="bg-transparent border-none text-white opacity-50 cursor-pointer transition-transform duration-200 hover:text-error hover:opacity-100 hover:scale-110"
          title="Déconnexion"
          onClick={logout}
          >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
