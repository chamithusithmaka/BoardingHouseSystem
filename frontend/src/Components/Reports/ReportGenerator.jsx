import { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { FaFileDownload, FaSpinner, FaChartBar } from 'react-icons/fa';
import axios from 'axios';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  header: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#d97706' // amber-600
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    color: '#374151' // gray-700
  },
  section: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4b5563' // gray-600
  },
  itemContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    padding: 5,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb'
  },
  item: {
    flex: 1,
    fontSize: 10,
    color: '#374151' // gray-700
  },
  bold: {
    fontWeight: 'bold'
  },
  footer: {
    marginTop: 20,
    fontSize: 10,
    textAlign: 'center',
    color: '#6b7280' // gray-500
  }
});

// PDF Document component
const MyDocument = ({ data, reportType, dateRange }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Boarding House System</Text>
        <Text style={styles.subtitle}>
          {reportType === 'orders' ? 'Order Report' : 'Meals Report'}
        </Text>
        <Text style={styles.subtitle}>
          {`Generated on: ${new Date().toLocaleDateString()}`}
        </Text>
        {dateRange && (
          <Text style={styles.subtitle}>
            {`Period: ${dateRange.from} - ${dateRange.to}`}
          </Text>
        )}
      </View>

      {reportType === 'orders' ? (
        <OrdersReport orders={data} />
      ) : (
        <MealsReport meals={data} />
      )}

      <View style={styles.footer}>
        <Text>© {new Date().getFullYear()} Boarding House System. All rights reserved.</Text>
      </View>
    </Page>
  </Document>
);

// Orders Report Component
const OrdersReport = ({ orders }) => {
  // Group orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    const status = order.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(order);
    return acc;
  }, {});

  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.status === 'DELIVERED' ? order.totalCents : 0);
  }, 0);

  return (
    <>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Order Summary</Text>
        <Text style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>Total Orders: {orders.length}</Text>
        <Text style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>Total Revenue: LKR {(totalRevenue / 100).toFixed(2)}</Text>
        
        {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
          <Text key={status} style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>
            {status}: {statusOrders.length} orders
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        
        <View style={[styles.itemContainer, styles.bold]}>
          <Text style={[styles.item, { flex: 2 }]}>ID</Text>
          <Text style={styles.item}>Customer</Text>
          <Text style={styles.item}>Date</Text>
          <Text style={styles.item}>Status</Text>
          <Text style={styles.item}>Amount</Text>
        </View>

        {orders.slice(0, 20).map((order) => (
          <View key={order._id} style={styles.itemContainer}>
            <Text style={[styles.item, { flex: 2 }]}>
              #{order._id.substring(order._id.length - 6)}
            </Text>
            <Text style={styles.item}>{order.contactName}</Text>
            <Text style={styles.item}>
              {new Date(order.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.item}>{order.status}</Text>
            <Text style={styles.item}>LKR {(order.totalCents / 100).toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </>
  );
};

// Meals Report Component
const MealsReport = ({ meals }) => {
  // Group meals by type
  const mealsByType = meals.reduce((acc, meal) => {
    const type = meal.mealType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(meal);
    return acc;
  }, {});

  return (
    <>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Meal Summary</Text>
        <Text style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>Total Meals: {meals.length}</Text>
        
        {Object.entries(mealsByType).map(([type, typeMeals]) => (
          <Text key={type} style={{ fontSize: 10, color: '#374151', marginBottom: 4 }}>
            {type}: {typeMeals.length} meals
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal List</Text>
        
        <View style={[styles.itemContainer, styles.bold]}>
          <Text style={[styles.item, { flex: 2 }]}>Name</Text>
          <Text style={styles.item}>Type</Text>
          <Text style={styles.item}>Rating</Text>
          <Text style={styles.item}>Status</Text>
        </View>

        {meals.map((meal) => (
          <View key={meal._id} style={styles.itemContainer}>
            <Text style={[styles.item, { flex: 2 }]}>{meal.name}</Text>
            <Text style={styles.item}>{meal.mealType}</Text>
            <Text style={styles.item}>{meal.ratingAvg.toFixed(1)} ({meal.ratingCount})</Text>
            <Text style={styles.item}>{meal.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        ))}
      </View>
    </>
  );
};

// Main component
const ReportGenerator = () => {
  const API_URL = 'http://localhost:5000/api';
  
  const [reportType, setReportType] = useState('orders');
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = `${API_URL}/${reportType}?`;
      if (dateRange.from) url += `fromDate=${dateRange.from}&`;
      if (dateRange.to) url += `toDate=${dateRange.to}`;
      
      const response = await axios.get(url);
      setReportData(response.data.data[reportType]);
    } catch (err) {
      console.error(`Error fetching ${reportType} data:`, err);
      setError(`Failed to load ${reportType} data.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FaChartBar className="mr-3 text-amber-500" />
        Generate Reports
      </h2>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-md p-4 mb-4 text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
          >
            <option value="orders">Orders Report</option>
            <option value="meals">Meals Report</option>
          </select>
        </div>
        
        <div>
          <label className="block mb-2 font-medium">From Date</label>
          <input
            type="date"
            name="from"
            value={dateRange.from}
            onChange={handleDateChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div>
          <label className="block mb-2 font-medium">To Date</label>
          <input
            type="date"
            name="to"
            value={dateRange.to}
            onChange={handleDateChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={fetchReportData}
          className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md flex items-center"
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaChartBar className="mr-2" />
          )}
          Generate Report
        </button>

        {reportData && !loading && (
          <PDFDownloadLink
            document={<MyDocument data={reportData} reportType={reportType} dateRange={dateRange} />}
            fileName={`${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf`}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
          >
            {({ blob, url, loading, error }) =>
              loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Loading Document...
                </>
              ) : (
                <>
                  <FaFileDownload className="mr-2" />
                  Download PDF
                </>
              )
            }
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;