const nodemailer = require("nodemailer");

// Port 465 hole secure true hobe, 587 hole false hobe
const emailPort = Number(process.env.EMAIL_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: emailPort,
  secure: emailPort === 465, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("Nodemailer Connection Error:", error);
  } else {
    console.log("Nodemailer is Ready to send emails!");
  }
});

module.exports = transporter;