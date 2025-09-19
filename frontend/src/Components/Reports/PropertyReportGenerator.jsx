import React, { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { FaFilePdf, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5000/api';

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
  propertyContainer: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 5,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  propertyAddress: {
    fontSize: 12,
    marginBottom: 10,
    color: '#4b5563',
  },
  propertyDetail: {
    fontSize: 10,
    marginBottom: 5,
    color: '#4b5563',
  },
  roomsTable: {
    display: 'flex',
    width: 'auto',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
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
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col: {
    flex: 1,
  },
  amenitiesList: {
    marginLeft: 10,
    fontSize: 10,
    color: '#4b5563',
  },
  facilityItem: {
    fontSize: 10,
    marginBottom: 2,
    color: '#4b5563',
  },
  roomContainer: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  roomHeader: {
    backgroundColor: '#f9fafb',
    paddingVertical: 3,
    paddingHorizontal: 5,
    marginBottom: 5,
  },
});

// PDF Document Component
const ComprehensivePropertyReport = ({ data }) => (
  <Document>
    {/* Cover Page */}
    <Page size="A4" style={styles.page}>
      <View style={[styles.header, { height: 200, justifyContent: 'center' }]}>
        <Text style={[styles.title, { fontSize: 24 }]}>Boarding House System</Text>
        <Text style={[styles.subtitle, { fontSize: 16, marginTop: 10 }]}>
          Property and Room Report
        </Text>
        <Text style={[styles.subtitle, { marginTop: 30 }]}>
          Generated on: {new Date().toLocaleDateString()}
        </Text>
      </View>

      <View style={[styles.section, { marginTop: 40 }]}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.propertyDetail}>Total Properties: {data.properties.length}</Text>
        <Text style={styles.propertyDetail}>
          Total Rooms: {data.properties.reduce((sum, property) => sum + (property.rooms?.length || 0), 0)}
        </Text>
        <Text style={styles.propertyDetail}>
          Occupied Rooms: {data.properties.reduce((sum, property) => 
            sum + (property.rooms?.filter(room => room.status === 'full').length || 0), 0)}
        </Text>
        <Text style={styles.propertyDetail}>
          Available Rooms: {data.properties.reduce((sum, property) => 
            sum + (property.rooms?.filter(room => room.status === 'vacant' || room.status === 'available').length || 0), 0)}
        </Text>
      </View>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} Boarding House Management System
      </Text>
    </Page>

    {/* Generate a separate page for each property */}
    {data.properties.map((property, propertyIndex) => (
      <Page key={`property-${propertyIndex}`} size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{property.name}</Text>
          <Text style={styles.subtitle}>Property ID: {property.id}</Text>
          <Text style={styles.subtitle}>{property.address}</Text>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.propertyDetail}>
                Total Rooms: {property.rooms?.length || 0}
              </Text>
              <Text style={styles.propertyDetail}>
                Occupied Rooms: {property.rooms?.filter(room => room.status === 'full').length || 0}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.propertyDetail}>
                Available Rooms: {property.rooms?.filter(room => 
                  room.status === 'vacant' || room.status === 'available').length || 0}
              </Text>
              <Text style={styles.propertyDetail}>
                Maintenance: {property.rooms?.filter(room => room.status === 'maintenance').length || 0}
              </Text>
            </View>
          </View>

          {property.description && (
            <Text style={[styles.propertyDetail, { marginTop: 10 }]}>
              Description: {property.description}
            </Text>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.propertyDetail}>Amenities:</Text>
              {property.amenities.map((amenity, i) => (
                <Text key={i} style={styles.amenitiesList}>• {amenity}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Rooms Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rooms Summary</Text>
          
          <View style={styles.roomsTable}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Room #</Text>
              <Text style={styles.tableCell}>Type</Text>
              <Text style={styles.tableCell}>Capacity</Text>
              <Text style={styles.tableCell}>Status</Text>
              <Text style={styles.tableCell}>Price (LKR)</Text>
            </View>
            
            {property.rooms && property.rooms.map((room, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{room.roomNumber}</Text>
                <Text style={styles.tableCell}>{room.type || 'Standard'}</Text>
                <Text style={styles.tableCell}>
                  {room.occupants?.length || 0}/{room.capacity || 0}
                </Text>
                <Text style={styles.tableCell}>{room.status}</Text>
                <Text style={styles.tableCell}>
                  {room.price?.toLocaleString?.() || '0'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.pageNumber}>
          Page {propertyIndex + 2} of {data.properties.length + 1}
        </Text>
      </Page>
    ))}

    {/* Rooms Details Page */}
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Room Details</Text>
        <Text style={styles.subtitle}>Comprehensive Room Information</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Rooms</Text>
        
        {data.properties.flatMap((property, propertyIndex) => (
          property.rooms?.map((room, roomIndex) => (
            <View key={`${propertyIndex}-${roomIndex}`} style={styles.roomContainer}>
              <View style={styles.roomHeader}>
                <Text style={[styles.propertyName, { fontSize: 12 }]}>
                  {property.name} - Room {room.roomNumber}
                </Text>
              </View>
              
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.propertyDetail}>Status: {room.status}</Text>
                  <Text style={styles.propertyDetail}>
                    Occupancy: {room.occupants?.length || 0}/{room.capacity || 0}
                  </Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.propertyDetail}>
                    Price: LKR {room.price?.toLocaleString?.() || '0'}
                  </Text>
                  <Text style={styles.propertyDetail}>
                    Type: {room.type || 'Standard'}
                  </Text>
                </View>
              </View>
              
              {room.facilities && room.facilities.length > 0 && (
                <View style={{ marginTop: 5 }}>
                  <Text style={styles.propertyDetail}>Facilities:</Text>
                  <View style={styles.row}>
                    {room.facilities.slice(0, 3).map((facility, i) => (
                      <Text key={i} style={[styles.facilityItem, { marginLeft: 10 }]}>
                        • {facility}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )) || []
        ))}
      </View>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} Boarding House Management System
      </Text>
      <Text style={styles.pageNumber}>
        Page {data.properties.length + 2} of {data.properties.length + 2}
      </Text>
    </Page>
  </Document>
);

// Main component with data fetching
const ComprehensiveReportButton = ({ properties = [], className }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const prepareReportData = async () => {
    setLoading(true);
    
    try {
      // For each property, fetch its rooms
      const propertiesWithRooms = await Promise.all(
        properties.map(async (property) => {
          try {
            const roomsResponse = await axios.get(`${API_URL}/properties/${property.id}/rooms`);
            const rooms = roomsResponse.data.data.rooms || [];
            
            return {
              ...property,
              rooms: rooms.map(room => ({
                roomNumber: room.roomNumber,
                capacity: room.capacity,
                occupants: room.currentOccupants || [],
                status: room.status,
                type: room.type,
                price: room.price?.amount,
                facilities: room.facilities,
                description: room.description
              }))
            };
          } catch (err) {
            console.error(`Error fetching rooms for property ${property.id}:`, err);
            return {
              ...property,
              rooms: []
            };
          }
        })
      );
      
      setReportData({
        properties: propertiesWithRooms
      });
      
    } catch (error) {
      console.error("Error preparing report data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {reportData ? (
        <PDFDownloadLink
          document={<ComprehensivePropertyReport data={reportData} />}
          fileName={`property-room-report-${new Date().toISOString().slice(0, 10)}.pdf`}
          className={className || "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"}
        >
          {({ blob, url, loading, error }) =>
            loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <FaFilePdf className="mr-2" />
                Download Complete Report
              </>
            )
          }
        </PDFDownloadLink>
      ) : (
        <button
          onClick={prepareReportData}
          disabled={loading}
          className={className || "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Preparing Data...
            </>
          ) : (
            <>
              <FaFilePdf className="mr-2" />
              Generate Complete Report
            </>
          )}
        </button>
      )}
    </>
  );
};

export { ComprehensiveReportButton };