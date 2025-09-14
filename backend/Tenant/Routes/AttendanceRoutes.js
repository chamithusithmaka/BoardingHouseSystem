const express = require('express');
const attendanceController = require('../Controllers/AttendanceController');

const router = express.Router();

// Routes for tenant check-in/check-out
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);

// Routes for attendance data
router.get('/today/:tenantId', attendanceController.getTodayAttendance);
router.get('/history/:tenantId', attendanceController.getAttendanceHistory);
router.get('/summary', attendanceController.getAttendanceSummary);

// Routes for utility settings
router.put('/settings/:propertyId', attendanceController.updateUtilitySettings);
router.get('/settings/:propertyId', attendanceController.getUtilitySettings);
// Add this to AttendanceRoutes.js
router.post('/finance-alert', attendanceController.sendFinanceAlert);
// Fix the route path and add tenantId parameter
router.post('/mark-absent-test/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const markedCount = await attendanceController.markAbsentTenants(false, tenantId);
    res.status(200).json({
      status: 'success',
      message: `Marked tenant ${tenantId} as absent (24-hour check)`,
      data: { markedCount }
    });
  } catch (error) {
    console.error('Error in absent marking test:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Add this route to your AttendanceRoutes.js
router.post('/create-record', attendanceController.createAttendanceRecord);

module.exports = router;