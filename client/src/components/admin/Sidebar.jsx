import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/admin',             icon: '📊', label: 'Tổng quan',       end: true },
  { path: '/admin/users',       icon: '👥', label: 'Quản lý User' },
  { path: '/admin/roles',       icon: '🏷️', label: 'Quản lý Role' },
  { path: '/admin/permissions', icon: '🔑', label: 'Quản lý Quyền' },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 min-h-screen bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white font-['Outfit']">
          💻 Tech<span className="text-blue-400">shop</span>
        </h1>
        <p className="text-slate-500 text-xs mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm">🧑‍💻</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
            text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all duration-200"
        >
          🚪 Đăng Xuất
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
