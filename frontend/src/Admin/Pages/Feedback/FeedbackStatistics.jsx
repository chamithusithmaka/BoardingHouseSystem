import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaChartBar, FaArrowLeft, FaSpinner, FaExclamationTriangle, 
  FaComment, FaCalendarAlt
} from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, 
  Cell, ResponsiveContainer, LineChart, Line, CartesianGrid 
} from 'recharts';

// Base API URL
const API_URL = 'http://localhost:5000/api';

const FeedbackStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    newCount: 0,
    respondedCount: 0,
    archivedCount: 0,
    recentTrends: []
  });
  
  // Fetch feedback statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/feedback/stats`);
        setStats(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback statistics:', err);
        setError(err.response?.data?.message || 'Failed to load feedback statistics');
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Data for pie chart
  const statusData = [
    { name: 'New', value: stats.stats?.newCount || 0, color: '#3182CE' },
    { name: 'Responded', value: stats.stats?.respondedCount || 0, color: '#38A169' },
    { name: 'Archived', value: stats.stats?.archivedCount || 0, color: '#718096' }
  ];
  
  // Fill in missing dates for the trend chart
  const getTrendData = () => {
    if (!stats.recentTrends || stats.recentTrends.length === 0) {
      return [];
    }
    
    const trends = [...stats.recentTrends];
    const result = [];
    
    // Sort by date
    trends.sort((a, b) => new Date(a._id) - new Date(b._id));
    
    // Get date range
    const startDate = new Date(trends[0]._id);
    const endDate = new Date(trends[trends.length - 1]._id);
    
    // Fill in all dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const existingData = trends.find(item => item._id === dateString);
      
      result.push({
        date: dateString,
        count: existingData ? existingData.count : 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <FaChartBar className="mr-3 text-amber-500" />
          Feedback Statistics
        </h1>
        
        <Link
          to="/admin/feedback"
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <FaArrowLeft className="mr-2" /> 
          Back to Feedback List
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <FaSpinner className="text-amber-500 text-3xl animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 flex items-center">
              <div className="bg-gray-700 p-3 rounded-full mr-4">
                <FaComment className="text-amber-500 text-xl" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Feedback</p>
                <p className="text-white text-2xl font-bold">{stats.stats?.totalCount || 0}</p>
              </div>
            </div>
            
            <div className="bg-blue-900/50 rounded-lg p-4 flex items-center">
              <div className="bg-blue-800/50 p-3 rounded-full mr-4">
                <FaExclamationTriangle className="text-blue-400 text-xl" />
              </div>
              <div>
                <p className="text-blue-300 text-sm">New</p>
                <p className="text-white text-2xl font-bold">{stats.stats?.newCount || 0}</p>
              </div>
            </div>
            
            <div className="bg-green-900/50 rounded-lg p-4 flex items-center">
              <div className="bg-green-800/50 p-3 rounded-full mr-4">
                <FaComment className="text-green-400 text-xl" />
              </div>
              <div>
                <p className="text-green-300 text-sm">Responded</p>
                <p className="text-white text-2xl font-bold">{stats.stats?.respondedCount || 0}</p>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 flex items-center">
              <div className="bg-gray-600 p-3 rounded-full mr-4">
                <FaCalendarAlt className="text-gray-400 text-xl" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Response Rate</p>
                <p className="text-white text-2xl font-bold">
                  {stats.stats?.totalCount ? 
                    `${Math.round((stats.stats.respondedCount / stats.stats.totalCount) * 100)}%` : 
                    '0%'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Chart */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              <h2 className="text-lg font-medium text-white mb-4">Feedback Status Distribution</h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} feedback`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Recent Trend Chart */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
              <h2 className="text-lg font-medium text-white mb-4">Recent Feedback Trend (30 Days)</h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getTrendData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end"
                      tick={{ fill: '#999' }}
                      height={70}
                    />
                    <YAxis tick={{ fill: '#999' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#333', borderColor: '#555' }}
                      formatter={(value) => [`${value} feedback`, 'Count']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Feedback Count"
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedbackStatistics;