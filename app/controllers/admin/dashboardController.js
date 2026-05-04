const User = require("../../models/User");
const Exam = require("../../models/Exam");
const Result = require("../../models/Result");
const logger = require("../../utils/logger");

class DashboardController {
  async renderDashboard(req, res) {
    try {
      let examQuery = { isDeleted: false };
      if (req.user.role === "Examiner") {
        examQuery.examinerId = req.user._id;
      }

      const [totalUsers, totalCandidates, totalExams, totalSubmissions] =
        await Promise.all([
          User.countDocuments({ isDeleted: false }),
          User.countDocuments({ role: "Candidate", isDeleted: false }),
          Exam.countDocuments(examQuery),
          Result.countDocuments({ status: "Completed" }),
        ]);

      res.render("admin/dashboard", {
        title: "Admin Dashboard",
        stats: { totalUsers, totalCandidates, totalExams, totalSubmissions },
        user: req.user,
      });
    } catch (error) {
      logger.error(`Error rendering dashboard: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }
}

module.exports = new DashboardController();
