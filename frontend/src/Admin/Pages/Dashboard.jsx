import { FaBuilding, FaDoorOpen, FaUserTie, FaExclamationTriangle } from 'react-icons/fa';

const Dashboard = () => {
  // These would typically come from API calls
  const statistics = [
    { title: 'Total Properties', value: '5', icon: <FaBuilding size={24} />, color: 'bg-blue-600' },
    { title: 'Total Rooms', value: '32', icon: <FaDoorOpen size={24} />, color: 'bg-green-600' },
    { title: 'Total Tenants', value: '28', icon: <FaUserTie size={24} />, color: 'bg-purple-600' },
    { title: 'Pending Issues', value: '7', icon: <FaExclamationTriangle size={24} />, color: 'bg-red-600' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statistics.map((stat, index) => (
          <div
            key={index}
            className={`${stat.color} rounded-lg shadow-lg p-6 transition-transform duration-300 transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-lg font-medium mb-1">{stat.title}</h2>
                <p className="text-white text-3xl font-bold">{stat.value}</p>
              </div>
              <div className="text-white opacity-80">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="border-b border-gray-700 pb-4">
              <div className="flex justify-between">
                <p className="text-gray-200">New tenant registered</p>
                <span className="text-gray-400 text-sm">2 hours ago</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                John Doe has registered as a new tenant
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
              Add Property
            </button>
            <button className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
              Add Room
            </button>
            <button className="bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700">
              Register Tenant
            </button>
            <button className="bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700">
              View Reports
            </button>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">System Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between mb-1">
              <span className="text-gray-200">Room Occupancy</span>
              <span className="text-gray-200">85%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>

            <div className="flex justify-between mb-1">
              <span className="text-gray-200">Rent Collection</span>
              <span className="text-gray-200">72%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }}></div>
            </div>

            <div className="flex justify-between mb-1">
              <span className="text-gray-200">Maintenance Issues</span>
              <span className="text-gray-200">23%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{ width: '23%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;