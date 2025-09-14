import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-800">
      <Sidebar />
      <div className={`flex-1 ml-64 p-8 overflow-auto`}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;