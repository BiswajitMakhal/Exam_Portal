// Function to generate Report Card HTML
const generateReportCardHTML = (
  candidateName,
  examName,
  obtainedMarks,
  totalMarks,
) => {
  const percentage = ((obtainedMarks / totalMarks) * 100).toFixed(2);

  // Pass ba Fail status
  const status =
    percentage >= 40
      ? '<span style="color: #198754; font-weight: bold;">PASSED</span>'
      : '<span style="color: #dc3545; font-weight: bold;">FAILED</span>';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background-color: #0d6efd; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">📝 ExamPortal Result</h2>
        </div>
        
        <!-- Body -->
        <div style="padding: 30px; background-color: #f8f9fa;">
            <p style="font-size: 16px; color: #333;">Hello <strong>${candidateName}</strong>,</p>
            <p style="font-size: 16px; color: #555;">You have successfully completed the <strong>${examName}</strong> assessment. Here is your final report card:</p>
            
            <!-- Score Card -->
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px; color: #555;">Total Marks</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold;">${totalMarks}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px; color: #555;">Marks Obtained</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; color: #0d6efd; font-size: 18px;">${obtainedMarks}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px; color: #555;">Percentage</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold;">${percentage}%</td>
                </tr>
                <tr>
                    <td style="padding: 15px; color: #555;">Result Status</td>
                    <td style="padding: 15px; text-align: right;">${status}</td>
                </tr>
            </table>

            <p style="margin-top: 30px; font-size: 14px; color: #777; text-align: center;">
                If you have any questions regarding your result, please contact the administrator.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            &copy; 2026 Advanced Exam Portal. All rights reserved.
        </div>
    </div>
    `;
};

module.exports = {
  generateReportCardHTML,
};
