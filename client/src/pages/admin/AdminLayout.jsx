import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
