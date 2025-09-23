import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheck, FaTimes, FaEye, FaSpinner, FaIdCard, FaFileContract, FaSearch, FaFilter, FaTrash, FaFilePdf, FaFileExcel, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import AdminRegisterForm from '../../Components/AdminRegisterForm';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Create PDF styles
const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 12, marginBottom: 20, textAlign: 'center' },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#bfbfbf' },
  tableColHeader: { width: '20%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', backgroundColor: '#f0f0f0', padding: 5 },
  tableCol: { width: '20%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', padding: 5 },
  tableCell: { margin: 'auto', fontSize: 10 },
  footer: { position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', fontSize: 10 },
});

// PDF Document Component
const UserReportDocument = ({ users }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>User Management Report</Text>
      <Text style={styles.subtitle}>Generated on {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>User ID</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Name</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Email</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Role</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCell}>Status</Text>
          </View>
        </View>
        
        {users.map(user => (
          <View style={styles.tableRow} key={user.userId}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{user.userId}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{user.fullName}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{user.email}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{user.role}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{user.status}</Text>
            </View>
          </View>
        ))}
      </View>
      
      <Text style={styles.footer}>
        Boarding House Management System - User Report
      </Text>
    </Page>
  </Document>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [processingUserId, setProcessingUserId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/users`);
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
      setLoading(false);
    }
  };
  
  // Export to Excel function
  const exportToExcel = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    
    const ws = XLSX.utils.json_to_sheet(users.map(user => ({
      'User ID': user.userId,
      'Name': user.fullName,
      'Email': user.email,
      'Phone': user.phone,
      'NIC': user.nic,
      'Role': user.role,
      'Status': user.status,
      'Registration Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
    })));
    
    const wb = { Sheets: { 'Users': ws }, SheetNames: ['Users'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: fileType});
    
    const fileName = `user_report_${new Date().toLocaleDateString().replace(/\//g, '-')}${fileExtension}`;
    
    // Create download link and trigger click
    const href = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };
  
  const handleStatusChange = async (userId, status) => {
    if (status === 'rejected') {
      setProcessingUserId(userId);
      setIsRejectionModalOpen(true);
      return;
    }
    
    try {
      setProcessingUserId(userId);
      await axios.patch(`${API_URL}/users/users/${userId}/status`, { status });
      
      // Update local state
      setUsers(users.map(user => 
        user.userId === userId ? { ...user, status } : user
      ));
      
      toast.success(`User ${status === 'accepted' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error(`Error ${status} user:`, err);
      toast.error(`Failed to ${status} user. Please try again.`);
    } finally {
      setProcessingUserId(null);
    }
  };
  
  const submitRejection = async () => {
    try {
      await axios.patch(`${API_URL}/users/users/${processingUserId}/status`, {
        status: 'rejected',
        reason: rejectionReason
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.userId === processingUserId ? { ...user, status: 'rejected' } : user
      ));
      
      toast.success('User rejected successfully');
      setIsRejectionModalOpen(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting user:', err);
      toast.error('Failed to reject user. Please try again.');
    } finally {
      setProcessingUserId(null);
    }
  };
  
  // Filter users based on search term, status and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nic?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role?.toLowerCase() === roleFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Group users by status for quick stats
  const usersByStatus = {
    pending: users.filter(user => user.status === 'pending').length,
    accepted: users.filter(user => user.status === 'accepted').length,
    rejected: users.filter(user => user.status === 'rejected').length
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Add delete handler
  const handleDeleteUser = async (userId) => {
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      setProcessingUserId(userId);
      await axios.delete(`${API_URL}/users/users/${userId}`);
      setUsers(users.filter(user => user.userId !== userId));
      toast.success('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setProcessingUserId(null);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-white mb-6">User Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-blue-500/20 p-3 rounded-full">
            <FaIdCard className="text-blue-400 text-xl" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-gray-400 text-sm">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-500">{usersByStatus.pending}</p>
          </div>
          <div className="bg-yellow-500/20 p-3 rounded-full">
            <FaSpinner className="text-yellow-400 text-xl" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-gray-400 text-sm">Approved</p>
            <p className="text-2xl font-bold text-green-500">{usersByStatus.accepted}</p>
          </div>
          <div className="bg-green-500/20 p-3 rounded-full">
            <FaCheck className="text-green-400 text-xl" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-lg">
          <div>
            <p className="text-gray-400 text-sm">Rejected</p>
            <p className="text-2xl font-bold text-red-500">{usersByStatus.rejected}</p>
          </div>
          <div className="bg-red-500/20 p-3 rounded-full">
            <FaTimes className="text-red-400 text-xl" />
          </div>
        </div>
      </div>
      
      {/* Download Buttons */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Add Admin Button */}
        <button
          onClick={() => setIsAdminFormOpen(true)}
          className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors"
        >
          <FaUser className="mr-2" /> Add New Admin
        </button>
        
        <PDFDownloadLink
          document={<UserReportDocument users={users} />}
          fileName={`user_report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`}
          className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          {({ loading }) => (
            loading ? 
            <><FaSpinner className="animate-spin mr-2" /> Preparing PDF...</> : 
            <><FaFilePdf className="mr-2" /> Download as PDF</>
          )}
        </PDFDownloadLink>
        
        <button
          onClick={exportToExcel}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
        >
          <FaFileExcel className="mr-2" /> Download as Excel
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users by name, email or ID..."
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="relative flex-grow md:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaFilter className="text-gray-400" />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="tenant">Tenant</option>
              <option value="owner">Owner</option>
              <option value="mealsupplier">Meal Supplier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <FaSpinner className="animate-spin text-amber-500 text-4xl" />
            </div>
          ) : error ? (
            <div className="text-red-400 p-6 text-center">{error}</div>
          ) : (
            <table className="w-full text-left text-white">
              <thead className="bg-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">User ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Registered</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.userId} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="px-6 py-4">{user.userId}</td>
                      <td className="px-6 py-4 font-medium">{user.fullName}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${user.role?.toLowerCase() === 'tenant' ? 'bg-blue-900 text-blue-200' : ''}
                          ${user.role?.toLowerCase() === 'owner' ? 'bg-purple-900 text-purple-200' : ''}
                          ${user.role?.toLowerCase() === 'mealsupplier' ? 'bg-green-900 text-green-200' : ''}
                          ${user.role?.toLowerCase() === 'admin' ? 'bg-red-900 text-red-200' : ''}
                        `}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${user.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : ''}
                          ${user.status === 'accepted' ? 'bg-green-900 text-green-200' : ''}
                          ${user.status === 'rejected' ? 'bg-red-900 text-red-200' : ''}
                        `}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(user.userId, 'accepted')}
                                disabled={processingUserId === user.userId}
                                className={`text-green-400 hover:text-green-300 transition-colors ${processingUserId === user.userId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Approve User"
                              >
                                {processingUserId === user.userId ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                              </button>
                              <button
                                onClick={() => handleStatusChange(user.userId, 'rejected')}
                                disabled={processingUserId === user.userId}
                                className={`text-red-400 hover:text-red-300 transition-colors ${processingUserId === user.userId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Reject User"
                              >
                                {processingUserId === user.userId ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                              </button>
                            </>
                          )}
                          {/* Delete button for all users */}
                          <button
                            onClick={() => handleDeleteUser(user.userId)}
                            disabled={processingUserId === user.userId}
                            className={`text-red-500 hover:text-red-400 transition-colors ${processingUserId === user.userId ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Delete User"
                          >
                            {processingUserId === user.userId ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* User Details Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">User Details</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4 text-amber-400">User Information</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">User ID</p>
                        <p className="font-medium">{selectedUser.userId}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Full Name</p>
                        <p className="font-medium">{selectedUser.fullName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="font-medium">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">NIC</p>
                        <p className="font-medium">{selectedUser.nic}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Phone</p>
                        <p className="font-medium">{selectedUser.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Address</p>
                        <p className="font-medium">{selectedUser.address}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Role</p>
                        <p className="font-medium">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${selectedUser.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : ''}
                          ${selectedUser.status === 'accepted' ? 'bg-green-900 text-green-200' : ''}
                          ${selectedUser.status === 'rejected' ? 'bg-red-900 text-red-200' : ''}
                        `}>
                          {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Registered Date</p>
                        <p className="font-medium">
                          {selectedUser.createdAt ? formatDate(selectedUser.createdAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  {/* Documents */}
                  <div className="bg-gray-700 p-4 rounded-lg mb-6">
                    <h4 className="text-lg font-semibold mb-4 text-amber-400">Uploaded Documents</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* NIC Document */}
                      <div>
                        <p className="text-gray-400 text-sm mb-2">NIC Copy</p>
                        {selectedUser.nicCopy ? (
                          <div className="border border-gray-600 rounded-lg overflow-hidden">
                            {selectedUser.nicCopy.startsWith('data:image') ? (
                              <img 
                                src={selectedUser.nicCopy} 
                                alt="NIC Copy" 
                                className="w-full object-contain max-h-64"
                              />
                            ) : (
                              <div className="flex items-center justify-center p-8 text-gray-400">
                                <FaIdCard className="text-3xl mr-2" />
                                <span>NIC Document</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-800 rounded-lg p-4 text-gray-400 text-center">
                            No NIC document uploaded
                          </div>
                        )}
                      </div>
                      
                      {/* Rental Agreement */}
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Rental Agreement</p>
                        {selectedUser.rentalAgreement ? (
                          <div className="border border-gray-600 rounded-lg overflow-hidden">
                            {selectedUser.rentalAgreement.startsWith('data:image') ? (
                              <img 
                                src={selectedUser.rentalAgreement} 
                                alt="Rental Agreement" 
                                className="w-full object-contain max-h-64"
                              />
                            ) : (
                              <div className="flex items-center justify-center p-8 text-gray-400">
                                <FaFileContract className="text-3xl mr-2" />
                                <span>Rental Agreement Document</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-800 rounded-lg p-4 text-gray-400 text-center">
                            No rental agreement uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tenant Specific Information */}
                  {selectedUser.role === 'Tenant' && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold mb-4 text-amber-400">Tenant Profile</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Gender</p>
                          <p className="font-medium">{selectedUser.gender || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Age</p>
                          <p className="font-medium">{selectedUser.age || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Occupation</p>
                          <p className="font-medium">{selectedUser.occupation || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Cleanliness Level</p>
                          <p className="font-medium">{selectedUser.cleanlinessLevel || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Noise Tolerance</p>
                          <p className="font-medium">{selectedUser.noiseTolerance || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Sleeping Habit</p>
                          <p className="font-medium">{selectedUser.sleepingHabit || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Social Behavior</p>
                          <p className="font-medium">{selectedUser.socialBehavior || 'Not specified'}</p>
                        </div>
                        <div className="flex space-x-4">
                          <div>
                            <p className="text-gray-400 text-sm">Smoker</p>
                            <p className="font-medium">{selectedUser.smoking ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Drinks Alcohol</p>
                            <p className="font-medium">{selectedUser.alcoholic ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                        {/* <div className="col-span-2">
                          <p className="text-gray-400 text-sm">Food Allergies</p>
                          <p className="font-medium">
                            {selectedUser.foodAllergies || 'None specified'}
                          </p>
                        </div> */}
                        <div className="col-span-2">
                          <p className="text-gray-400 text-sm">Medical Conditions</p>
                          <p className="font-medium">
                            {selectedUser.medicalConditions || 'None specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions for pending users */}
              {selectedUser.status === 'pending' && (
                <div className="flex justify-end space-x-4 border-t border-gray-700 pt-4">
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleStatusChange(selectedUser.userId, 'rejected');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleStatusChange(selectedUser.userId, 'accepted');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Rejection Modal */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="border-b border-gray-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Reject User</h3>
            </div>
            
            <div className="p-6">
              <p className="mb-4 text-gray-300">
                Please provide a reason for rejection. This will be stored for record purposes.
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:border-amber-500 min-h-[100px]"
              ></textarea>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setIsRejectionModalOpen(false);
                    setRejectionReason('');
                    setProcessingUserId(null);
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Register Form Modal */}
      {isAdminFormOpen && (
        <AdminRegisterForm 
          onClose={() => setIsAdminFormOpen(false)} 
          onAdminAdded={fetchUsers}
        />
      )}
    </div>
  );
};

export default UserManagement;