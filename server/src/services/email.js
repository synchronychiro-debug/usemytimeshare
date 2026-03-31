const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.FROM_EMAIL || 'noreply@usemytimeshare.com';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SKIPPED - no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  const transporter = getTransporter();
  await transporter.sendMail({ from: FROM, to, subject, html });
}

async function sendBookingConfirmation({ booking, renter, listing, week }) {
  await sendEmail({
    to: renter.email,
    subject: `Booking Confirmed — ${listing.title}`,
    html: `
      <h2>Your booking is confirmed!</h2>
      <p>Hi ${renter.firstName},</p>
      <p>Great news! Your booking for <strong>${listing.title}</strong> has been confirmed.</p>
      <ul>
        <li><strong>Resort:</strong> ${listing.resortName}</li>
        <li><strong>Check-in:</strong> ${formatDate(week.startDate)}</li>
        <li><strong>Check-out:</strong> ${formatDate(week.endDate)}</li>
        <li><strong>Total paid:</strong> $${booking.totalAmount}</li>
      </ul>
      <p>Have a wonderful stay!</p>
      <p>— The UseMyTimeshare Team</p>
    `,
  });
}

async function sendBookingDeclined({ booking, renter, listing }) {
  await sendEmail({
    to: renter.email,
    subject: `Booking Update — ${listing.title}`,
    html: `
      <h2>Booking Not Available</h2>
      <p>Hi ${renter.firstName},</p>
      <p>Unfortunately, the owner was unable to confirm your booking for <strong>${listing.title}</strong>.</p>
      <p>Your payment has been fully refunded and should appear within 5–7 business days.</p>
      <p>We encourage you to browse other available listings.</p>
      <p>— The UseMyTimeshare Team</p>
    `,
  });
}

async function sendNewBookingNotification({ booking, owner, renter, listing, week }) {
  await sendEmail({
    to: owner.email,
    subject: `New Booking Request — ${listing.title}`,
    html: `
      <h2>You have a new booking request!</h2>
      <p>Hi ${owner.firstName},</p>
      <p><strong>${renter.firstName} ${renter.lastName}</strong> wants to book your listing: <strong>${listing.title}</strong>.</p>
      <ul>
        <li><strong>Check-in:</strong> ${formatDate(week.startDate)}</li>
        <li><strong>Check-out:</strong> ${formatDate(week.endDate)}</li>
        <li><strong>Guests:</strong> ${booking.guestCount}</li>
        <li><strong>Your payout:</strong> $${booking.ownerPayout}</li>
      </ul>
      <p>Log in to your dashboard to confirm or decline this booking.</p>
      <p>— The UseMyTimeshare Team</p>
    `,
  });
}

module.exports = { sendBookingConfirmation, sendBookingDeclined, sendNewBookingNotification };
