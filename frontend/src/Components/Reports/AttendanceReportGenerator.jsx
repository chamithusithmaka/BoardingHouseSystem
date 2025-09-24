import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { FaFilePdf, FaSpinner } from 'react-icons/fa';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#d97706',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
    color: '#374151',
  },
  section: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4b5563',
  },
  summaryItem: {
    fontSize: 10,
    marginBottom: 5,
    color: '#4b5563',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 24,
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
  tenantCell: {
    flex: 2,
    fontSize: 10,
    textAlign: 'left',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#6b7280',
  },
});

// PDF Document Component
const AttendanceReport = ({ data, dateRange }) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.page}>
      <View style={[styles.header, { height: 200, justifyContent: 'center' }]}>
        <Text style={[styles.title, { fontSize: 24 }]}>Boarding House System</Text>
        <Text style={[styles.subtitle, { fontSize: 16, marginTop: 10 }]}>
          Tenant Attendance Report
        </Text>
        <Text style={[styles.subtitle, { marginTop: 30 }]}>
          Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
        </Text>
        <Text style={[styles.subtitle, { marginTop: 10 }]}>
          Generated on: {new Date().toLocaleDateString()}
        </Text>
      </View>

      <View style={[styles.section, { marginTop: 40 }]}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <Text style={styles.summaryItem}>Total Tenants: {data.length}</Text>
        <Text style={styles.summaryItem}>
          Total Present Days: {data.reduce((sum, item) => sum + (item.presentDays || 0), 0)}
        </Text>
        <Text style={styles.summaryItem}>
          Total Absent Days: {data.reduce((sum, item) => sum + (item.absentDays || 0), 0)}
        </Text>
        <Text style={styles.summaryItem}>
          Total Exceeded Days: {data.reduce((sum, item) => sum + (item.exceededDays || 0), 0)}
        </Text>
        <Text style={styles.summaryItem}>
          Total Extra Hours: {data.reduce((sum, item) => sum + (item.totalExceededHours || 0), 0)}
        </Text>
      </View>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} Boarding House Management System
      </Text>
    </Page>

    {/* Attendance Data Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Tenant Attendance Details</Text>
        <Text style={styles.subtitle}>
          Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Records</Text>
        
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tenantCell}>Tenant ID</Text>
          <Text style={styles.tableCell}>Present Days</Text>
          <Text style={styles.tableCell}>Absent Days</Text>
          <Text style={styles.tableCell}>Exceeded Days</Text>
          <Text style={styles.tableCell}>Total Hours</Text>
          <Text style={styles.tableCell}>Extra Hours</Text>
        </View>
        
        {data.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tenantCell}>{item.tenantId}</Text>
            <Text style={styles.tableCell}>
              {item.presentDays} / {item.totalDays}
            </Text>
            <Text style={styles.tableCell}>
              {item.absentDays} / {item.totalDays}
            </Text>
            <Text style={styles.tableCell}>{item.exceededDays || 0}</Text>
            <Text style={styles.tableCell}>{item.totalHours?.toFixed(1) || 0} hrs</Text>
            <Text style={styles.tableCell}>{item.totalExceededHours || 0} hrs</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} Boarding House Management System
      </Text>
      <Text style={styles.pageNumber}>Page 2 of 2</Text>
    </Page>
  </Document>
);

// Main button component to generate and download the PDF
const AttendanceReportButton = ({ attendanceData, dateRange, className }) => {
  return (
    <PDFDownloadLink
      document={<AttendanceReport data={attendanceData} dateRange={dateRange} />}
      fileName={`attendance-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`}
      className={className || "bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"}
    >
      {({ blob, url, loading, error }) =>
        loading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Generating PDF...
          </>
        ) : (
          <>
            <FaFilePdf className="mr-2" />
            Download PDF Report
          </>
        )
      }
    </PDFDownloadLink>
  );
};

export default AttendanceReportButton;