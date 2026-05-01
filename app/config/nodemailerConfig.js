const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com", 
  port: Number(process.env.EMAIL_PORT) || 587, 
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("NODEMAILER ERROR:", error);
  } else {
    console.log("Nodemailer is READY!");
  }
});

module.exports = transporter;