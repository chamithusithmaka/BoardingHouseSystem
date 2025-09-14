const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create a transporter with your SMTP settings using the provided credentials
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send a room allocation confirmation email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.name - Tenant name
   * @param {string} options.roomId - Room identifier
   * @param {string} options.propertyName - Property name
   * @param {Date} options.moveInDate - Move-in date
   * @returns {Promise<Object>} - Nodemailer send result
   */
  async sendRoomAllocationEmail(options) {
    const { email, name, roomId, propertyName, moveInDate } = options;

    // Format move-in date
    const formattedDate = moveInDate 
      ? new Date(moveInDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'as soon as possible';

    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Room Allocation Confirmation - ${roomId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #3498db; color: white; border-radius: 5px 5px 0 0;">
            <h2>Room Allocation Confirmation</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>We're pleased to inform you that a room has been allocated to you at our boarding house.</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Property:</strong> ${propertyName}</p>
              <p style="margin: 10px 0;"><strong>Room ID:</strong> ${roomId}</p>
              <p style="margin: 0;"><strong>Move-in Date:</strong> ${formattedDate}</p>
            </div>
            <p>Please ensure that you bring the following items on your move-in day:</p>
            <ul>
              <li>Valid ID</li>
              <li>Initial payment as per agreement</li>
              <li>Signed copy of the contract (if not already provided)</li>
            </ul>
            <p>If you have any questions or require further information, please don't hesitate to contact us.</p>
            <p>We look forward to welcoming you!</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${email}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send a room transfer approval email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.name - Tenant name
   * @param {string} options.oldRoom - Old room identifier
   * @param {string} options.newRoom - New room identifier
   * @param {Date} options.moveInDate - Move-in date
   * @param {string} options.message - Admin message
   * @returns {Promise<void>}
   */
  async sendTransferApprovedEmail({ email, name, oldRoom, newRoom, moveInDate, message }) {
    // Format move-in date
    const formattedDate = moveInDate 
      ? new Date(moveInDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'as soon as possible';

    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Room Transfer Request Has Been Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #2ecc71; color: white; border-radius: 5px 5px 0 0;">
            <h2>Transfer Approved</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your request to transfer from <strong>${oldRoom}</strong> to <strong>${newRoom}</strong> has been approved.</p>
            <p>Please move in by <strong>${formattedDate}</strong>.</p>
            <p>${message}</p>
            <p>If you have any questions or need further assistance, feel free to contact us.</p>
            <p>Best regards,</p>
            <p>The Boarding House Management</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Transfer approval email sent to ${email}: ${result.messageId}`);
    } catch (error) {
      console.error('Error sending transfer approval email:', error);
      throw error;
    }
  }

  /**
   * Send a room transfer rejection email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.name - Tenant name
   * @param {string} options.currentRoom - Current room identifier
   * @param {string} options.requestedRoom - Requested room identifier
   * @param {string} options.message - Admin message
   * @returns {Promise<void>}
   */
  async sendTransferRejectedEmail({ email, name, currentRoom, requestedRoom, message }) {
    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Room Transfer Request Has Been Declined`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #e74c3c; color: white; border-radius: 5px 5px 0 0;">
            <h2>Transfer Declined</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>We're sorry to inform you that your request to transfer from <strong>${currentRoom}</strong> to <strong>${requestedRoom}</strong> has been declined.</p>
            <p>${message}</p>
            <p>If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>
            <p>Best regards,</p>
            <p>The Boarding House Management</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Transfer rejection email sent to ${email}: ${result.messageId}`);
    } catch (error) {
      console.error('Error sending transfer rejection email:', error);
      throw error;
    }
  }

  /**
   * Send a move-out confirmation email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.name - Tenant name
   * @param {string} options.roomId - Room identifier
   * @param {Date} options.moveOutDate - Move-out date
   * @param {string} options.reason - Reason for moving out
   * @returns {Promise<void>}
   */
  async sendMoveOutConfirmation({ email, name, roomId, moveOutDate, reason }) {
    // Format move-out date
    const formattedDate = moveOutDate 
      ? new Date(moveOutDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'not specified';

    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Move-Out Request Confirmation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #f39c12; color: white; border-radius: 5px 5px 0 0;">
            <h2>Move-Out Confirmation</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>We have received your request to move out from room <strong>${roomId}</strong>.</p>
            <p>Your request is currently pending approval from our admin team.</p>
            <p><strong>Move-Out Date:</strong> ${formattedDate}</p>
            <p><strong>Reason for Moving Out:</strong> ${reason}</p>
            <p>You will be notified once your request has been processed.</p>
            <p>If you have any questions or need further assistance, feel free to contact us.</p>
            <p>Best regards,</p>
            <p>The Boarding House Management</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Move-out confirmation email sent to ${email}: ${result.messageId}`);
    } catch (error) {
      console.error('Error sending move-out confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send a move-out approval email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.name - Tenant name
   * @param {string} options.roomId - Room identifier
   * @param {Date} options.moveOutDate - Move-out date
   * @param {string} options.message - Admin message
   * @returns {Promise<void>}
   */
  async sendMoveOutApprovalEmail({ email, name, roomId, moveOutDate, message }) {
    // Format move-out date
    const formattedDate = moveOutDate 
      ? new Date(moveOutDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'not specified';

    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Move-Out Request Has Been Approved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #2ecc71; color: white; border-radius: 5px 5px 0 0;">
            <h2>Move-Out Approved</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your request to move out from room <strong>${roomId}</strong> on <strong>${formattedDate}</strong> has been approved.</p>
            <p>${message}</p>
            <p>Please ensure all your belongings are removed by your move-out date and the room is left in good condition.</p>
            <p>If you have any questions or need further assistance, feel free to contact us.</p>
            <p>Best regards,</p>
            <p>The Boarding House Management</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Move-out approval email sent to ${email}: ${result.messageId}`);
    } catch (error) {
      console.error('Error sending move-out approval email:', error);
      throw error;
    }
  }

  /**
   * Send a move-out rejection email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.name - Tenant name
   * @param {string} options.roomId - Room identifier
   * @param {string} options.message - Admin message
   * @returns {Promise<void>}
   */
  async sendMoveOutRejectionEmail({ email, name, roomId, message }) {
    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Move-Out Request Has Been Rejected`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #e74c3c; color: white; border-radius: 5px 5px 0 0;">
            <h2>Move-Out Rejected</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>We're sorry to inform you that your request to move out from room <strong>${roomId}</strong> has been rejected.</p>
            <p>${message}</p>
            <p>If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>
            <p>Best regards,</p>
            <p>The Boarding House Management</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Move-out rejection email sent to ${email}: ${result.messageId}`);
    } catch (error) {
      console.error('Error sending move-out rejection email:', error);
      throw error;
    }
  }

  /**
   * Send email when tenant exceeds utility hours
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.name - Tenant name
   * @param {number} options.exceededHours - Number of exceeded hours
   * @param {string} options.roomNumber - Room number
   * @param {number} options.extraCharge - Extra charge amount
   * @returns {Promise<void>}
   */
  async sendUtilityExceededEmail({ email, name, exceededHours, roomNumber, extraCharge, additionalNote }) {
    if (!email) return;
    
    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Utility Usage Alert - Hours Exceeded`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #e74c3c; color: white; border-radius: 5px 5px 0 0;">
            <h2>Utility Usage Alert</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>You have exceeded the allotted usage hours for room <strong>${roomNumber}</strong> by <strong>${exceededHours} hour(s)</strong>.</p>
            <p>Extra charges of <strong>₱${extraCharge.toFixed(2)}</strong> may apply to your next bill.</p>
            ${additionalNote ? `<p><strong>Note:</strong> ${additionalNote}</p>` : ''}
            <p>Please contact the property management if you have any questions.</p>
            <p>Thank you,</p>
            <p>Boarding House Management</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply directly to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Utility exceeded email sent to ${email}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending utility exceeded email:', error);
      throw error;
    }
  }

  /**
   * Send alert to finance about exceeded hours
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.ccEmail - CC recipient email
   * @param {string} options.tenantName - Tenant name
   * @param {string} options.tenantId - Tenant ID
   * @param {string} options.roomNumber - Room number
   * @param {string} options.roomId - Room ID
   * @param {number} options.exceededHours - Number of exceeded hours
   * @param {number} options.extraCharge - Extra charge amount
   * @param {Date} options.date - Date of the incident
   * @param {string} options.additionalNote - Additional notes
   * @returns {Promise<void>}
   */
  async sendFinanceUtilityAlert({ email, ccEmail, tenantName, tenantId, roomNumber, roomId, exceededHours, extraCharge, date, additionalNote }) {
    if (!email) return;
    
    const formattedDate = date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString();
    
    // Email content
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      cc: ccEmail, // Include CC if provided
      subject: `Finance Alert - Tenant Exceeded Utility Hours`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #f39c12; color: white; border-radius: 5px 5px 0 0;">
            <h2>Finance Alert: Utility Hours Exceeded</h2>
          </div>
          <div style="padding: 20px 0;">
            <h3>Tenant Utility Alert</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Tenant</td>
                <td style="padding: 8px;">${tenantName} (ID: ${tenantId})</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Room</td>
                <td style="padding: 8px;">${roomNumber} (ID: ${roomId})</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Date</td>
                <td style="padding: 8px;">${formattedDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Exceeded Hours</td>
                <td style="padding: 8px; color: #e74c3c;">${exceededHours} hours</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Extra Charge</td>
                <td style="padding: 8px; color: #e74c3c;">₱${extraCharge.toFixed(2)}</td>
              </tr>
            </table>
            
            ${additionalNote ? `
            <div style="background-color: #f8f9fa; border-left: 4px solid #f39c12; padding: 15px; margin-bottom: 20px;">
              <strong>Additional Notes:</strong>
              <p>${additionalNote}</p>
            </div>` : ''}
            
            <p>This is an automated notification. Please update the tenant's billing accordingly.</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message from the Boarding House System.</p>
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Finance alert sent to ${email}${ccEmail ? ` with cc to ${ccEmail}` : ''}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending finance alert:', error);
      throw error;
    }
  }

  /**
   * Send admin notification about new feedback
   */
  async sendAdminNotification({ subject, message }) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@boardinghouse.com';
    
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #3498db; color: white; border-radius: 5px 5px 0 0;">
            <h2>Admin Notification</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>${message}</p>
            <p>Please log in to the admin dashboard to view and respond.</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Admin notification email sent: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending admin notification:', error);
      throw error;
    }
  }

  /**
   * Send feedback response to tenant
   */
  async sendTenantFeedbackResponse({ email, name, adminResponse }) {
    if (!email) {
      console.log("No email provided for feedback response");
      return;
    }
    
    console.log(`Preparing to send feedback response to: ${email}`);
    
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER || 'noreply@boardinghouse.com'}>`,
      to: email,
      subject: `Response to Your Feedback`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; padding: 10px 0; background-color: #2ecc71; color: white; border-radius: 5px 5px 0 0;">
            <h2>Feedback Response</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Dear ${name},</p>
            <p>Thank you for your feedback. We appreciate your input.</p>
            <p>Our team has reviewed your comments and has the following response:</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #2ecc71; padding: 15px; margin: 15px 0;">
              "${adminResponse}"
            </div>
            <p>If you have any further questions or concerns, please don't hesitate to contact us.</p>
            <p>Thank you,</p>
            <p>Boarding House Management</p>
          </div>
          <div style="text-align: center; padding: 15px 0; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Boarding House Management System</p>
          </div>
        </div>
      `
    };

    try {
      // Check if transporter exists
      if (!this.transporter) {
        console.error('Email transporter not initialized');
        return null;
      }
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Feedback response email sent to ${email}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending feedback response email:', error);
      throw error;
    }
  }

  /**
   * Send announcement email to suppliers
   * @param {Object} options - Email options
   * @param {string} options.subject - Email subject
   * @param {string} options.message - Email message
   * @param {string} options.email - Recipient email
   * @returns {Promise<Object>} - Nodemailer send result
   */
  async sendSupplierAnnouncement({ subject, message, email }) {
    const mailOptions = {
      from: `"Boarding House System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Announcement from Meal Provider</h2>
        <p>${message}</p>
        <p style="margin-top: 30px; color: #888;">This is an automated message from the Boarding House System.</p>
      </div>`
    };
    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Supplier announcement sent to ${email}: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error('Error sending supplier announcement:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();