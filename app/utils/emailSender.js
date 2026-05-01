const transporter = require("../config/nodemailerConfig");
const logger = require("./logger");

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info(
      `Email sent successfully to ${to} | MessageID: ${info.messageId}`,
    );
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
