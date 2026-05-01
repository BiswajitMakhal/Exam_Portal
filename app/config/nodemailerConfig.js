const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  family: 4 // for render deploy (forcefully)
});

transporter.verify(function (error, success) {
  if (error) {
    console.error(" NODEMAILER ERROR IN RENDER:", error);
  } else {
    console.log("Nodemailer is completely READY on Render!");
  }
});

module.exports = transporter;