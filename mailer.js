// mailer.js
const nodemailer = require('nodemailer');

const FROM_EMAIL = process.env.FROM_EMAIL; // e.g. your_email@gmail.com
const FROM_PASS = process.env.FROM_PASS;   // e.g. app password
const IT_EMAIL = process.env.IT_EMAIL;     // e.g. itdept@example.com

if (!FROM_EMAIL || !FROM_PASS || !IT_EMAIL) {
  console.warn('Mailer not fully configured. Set FROM_EMAIL, FROM_PASS, IT_EMAIL env variables.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: FROM_EMAIL,
    pass: FROM_PASS
  }
});

async function sendNewTicketNotification(ticket) {
  if (!FROM_EMAIL || !FROM_PASS || !IT_EMAIL) return;
  const subject = `New IT Ticket [${ticket.priority}] - #${ticket.id}`;
  const body = `
New IT support ticket created
ID: ${ticket.id}
From: ${ticket.name} (${ticket.department})
Priority: ${ticket.priority}
Issue:
${ticket.issue}
  `;
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: IT_EMAIL,
    subject,
    text: body
  });
  console.log('Notification email sent');
}

module.exports = { sendNewTicketNotification };
