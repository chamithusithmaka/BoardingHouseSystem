import React, { useState } from 'react';
import { FaFilePdf, FaFileExcel, FaCalendarAlt, FaSpinner, FaDownload, FaFilter } from 'react-icons/fa';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: 'auto',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#666',
  },
});

// PDF Document Component
const UserReportDocument = ({ users, fromDate, toDate, statusFilter, roleFilter }) => {
  // Calculate statistics
  const totalUsers = users.length;
  const usersByRole = {};
  const usersByStatus = {};
  
  users.forEach(user => {
    // Group by role
    const role = user.role || 'Unknown';
    usersByRole[role] = (usersByRole[role] || 0) + 1;
    
    // Group by status
    const status = user.status || 'Unknown';
    usersByStatus[status] = (usersByStatus[status] || 0) + 1;
  });

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>User Management Report</Text>
          <Text style={styles.subtitle}>
            {fromDate && toDate 
              ? `Period: ${formatDate(fromDate)} - ${formatDate(toDate)}`
              : 'All Time Report'}
          </Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Summary</Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>Total Users: {totalUsers}</Text>
          
          {/* Status Summary */}
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>
            By Status:
          </Text>
          {Object.entries(usersByStatus).map(([status, count]) => (
            <Text key={status} style={{ fontSize: 10, marginBottom: 3 }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}: {count} users ({((count / totalUsers) * 100).toFixed(1)}%)
            </Text>
          ))}
          
          {/* Role Summary */}
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 5 }}>
            By Role:
          </Text>
          {Object.entries(usersByRole).map(([role, count]) => (
            <Text key={role} style={{ fontSize: 10, marginBottom: 3 }}>
              {role.charAt(0).toUpperCase() + role.slice(1)}: {count} users ({((count / totalUsers) * 100).toFixed(1)}%)
            </Text>
          ))}
        </View>

        {/* Filters Applied */}
        {(statusFilter !== 'all' || roleFilter !== 'all') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Applied Filters</Text>
            {statusFilter !== 'all' && (
              <Text style={{ fontSize: 10, marginBottom: 3 }}>
                Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Text>
            )}
            {roleFilter !== 'all' && (
              <Text style={{ fontSize: 10, marginBottom: 3 }}>
                Role: {roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
              </Text>
            )}
          </View>
        )}

        {/* Users Detail */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Details</Text>
          
          {/* Table Header */}
          <View style={[styles.table]}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '15%' }]}>User ID</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>Name</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>Email</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Role</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Status</Text>
            </View>
            
            {/* Table Rows */}
            {users.map((user) => (
              <View key={user.userId} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '15%' }]}>{user.userId}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{user.fullName}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{user.email}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{user.role}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} by Boarding House Management System
        </Text>
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

const UserReportGenerator = ({ users, statusFilter, roleFilter }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Generate report based on date range
  const generateReport = () => {
    setLoading(true);
    
    let filtered = [...users];
    
    // Apply date filter if both dates are selected
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // Include the entire end day
      
      filtered = filtered.filter(user => {
        if (!user.createdAt) return false;
        const createDate = new Date(user.createdAt);
        return createDate >= from && createDate <= to;
      });
    }
    
    setFilteredUsers(filtered);
    setShowReport(true);
    setLoading(false);
  };

  // Export to Excel
  const exportToExcel = () => {
    // Prepare data
    const data = filteredUsers.map(user => ({
      'User ID': user.userId,
      'Name': user.fullName,
      'Email': user.email,
      'Phone': user.phone,
      'NIC': user.nic,
      'Role': user.role,
      'Status': user.status,
      'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    
    // Generate file name
    const fileName = `users_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Export to file
    XLSX.writeFile(wb, fileName);
  };

  // Get today's date in YYYY-MM-DD format for the max date attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-white mb-4">User Report Generator</h2>
      
      {/* Date Range Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-2 font-medium text-gray-300">From Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-500" />
            </div>
            <input 
              type="date"
              max={today}
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                // Reset toDate if it's before fromDate
                if (toDate && e.target.value > toDate) setToDate('');
              }}
              className="bg-gray-700 border border-gray-600 text-white rounded-md block w-full pl-10 p-2.5 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        <div>
          <label className="block mb-2 font-medium text-gray-300">To Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaCalendarAlt className="text-gray-500" />
            </div>
            <input 
              type="date"
              min={fromDate || undefined}
              max={today}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-md block w-full pl-10 p-2.5 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>
      
      {/* Filter Info */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg">
        <div className="flex items-center mb-2">
          <FaFilter className="text-amber-400 mr-2" />
          <h3 className="font-semibold text-white">Applied Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400">Status:</span>
            <span className="ml-2 text-white">
              {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Role:</span>
            <span className="ml-2 text-white">
              {roleFilter === 'all' ? 'All' : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Generate Report Button */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={generateReport}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            loading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {loading ? <FaSpinner className="animate-spin mr-2" /> : null}
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
        
        {showReport && filteredUsers.length > 0 && (
          <>
            <PDFDownloadLink
              document={<UserReportDocument 
                users={filteredUsers} 
                fromDate={fromDate} 
                toDate={toDate} 
                statusFilter={statusFilter}
                roleFilter={roleFilter}
              />}
              fileName={`user_report_${new Date().toISOString().split('T')[0]}.pdf`}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              {({ loading }) => (
                loading 
                ? <><FaSpinner className="animate-spin mr-2" /> Preparing PDF...</>
                : <><FaFilePdf className="mr-2" /> Download as PDF</>
              )}
            </PDFDownloadLink>
            
            <button
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              <FaFileExcel className="mr-2" />
              Download as Excel
            </button>
          </>
        )}
      </div>
      
      {/* Report Summary Preview */}
      {showReport && (
        <div className="mt-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-white mb-4">Report Summary</h3>
            
            {filteredUsers.length === 0 ? (
              <div className="text-gray-400 text-center py-6">
                No users found for the selected date range and filters.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-800 p-3 rounded-md">
                    <div className="text-gray-400 text-sm">Total Users</div>
                    <div className="text-2xl font-bold text-white">{filteredUsers.length}</div>
                  </div>
                  
                  <div className="bg-gray-800 p-3 rounded-md">
                    <div className="text-gray-400 text-sm">Date Range</div>
                    <div className="font-medium text-white">
                      {fromDate && toDate 
                        ? `${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`
                        : 'All Time'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-3 rounded-md flex items-center">
                    <FaDownload className="text-amber-500 mr-3 text-xl" />
                    <div>
                      <div className="text-gray-400 text-sm">Export Options</div>
                      <div className="text-white text-sm">PDF and Excel available</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-amber-400 mb-2">User Distribution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* By Status */}
                    <div>
                      <h5 className="text-sm text-gray-400 mb-2">By Status:</h5>
                      <div className="space-y-2">
                        {['pending', 'accepted', 'rejected'].map(status => {
                          const count = filteredUsers.filter(user => user.status === status).length;
                          const percentage = (count / filteredUsers.length) * 100;
                          
                          return (
                            <div key={status} className="flex items-center">
                              <div className="w-32 text-sm">
                                {status.charAt(0).toUpperCase() + status.slice(1)}:
                              </div>
                              <div className="flex-grow h-2 bg-gray-600 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    status === 'pending' ? 'bg-yellow-500' :
                                    status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="ml-2 w-16 text-sm">{count} ({percentage.toFixed(1)}%)</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* By Role */}
                    <div>
                      <h5 className="text-sm text-gray-400 mb-2">By Role:</h5>
                      <div className="space-y-2">
                        {['tenant', 'owner', 'mealsupplier', 'admin'].map(role => {
                          const count = filteredUsers.filter(user => 
                            user.role?.toLowerCase() === role.toLowerCase()
                          ).length;
                          const percentage = (count / filteredUsers.length) * 100;
                          
                          return (
                            <div key={role} className="flex items-center">
                              <div className="w-32 text-sm">
                                {role.charAt(0).toUpperCase() + role.slice(1)}:
                              </div>
                              <div className="flex-grow h-2 bg-gray-600 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    role === 'tenant' ? 'bg-blue-500' :
                                    role === 'owner' ? 'bg-purple-500' : 
                                    role === 'mealsupplier' ? 'bg-green-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="ml-2 w-16 text-sm">{count} ({percentage.toFixed(1)}%)</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReportGenerator;