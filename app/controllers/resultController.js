const mongoose = require("mongoose");
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const logger = require("../utils/logger");

class ResultController {
  async renderExamsList(req, res) {
    try {
      let examQuery = { isDeleted: false, status: { $ne: "Draft" } };
      if (
        req.locals?.user?.role === "Examiner" ||
        req.user?.role === "Examiner"
      ) {
        const userId = req.user ? req.user._id : req.locals.user._id;
        examQuery.examinerId = userId;
      }

      const exams = await Exam.find(examQuery).sort({ createdAt: -1 });

      res.render("admin/results/index", {
        title: "Analytics & Results - Exam Portal",
        exams,
        error: req.query.error,
      });
    } catch (error) {
      logger.error(`Error in renderExamsList: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async renderScoreboard(req, res) {
    try {
      const examId = req.params.examId;
      const exam = await Exam.findById(examId);

      if (!exam) {
        return res.redirect("/admin/results?error=Exam not found");
      }

      const results = await Result.aggregate([
        {
          $match: {
            examId: new mongoose.Types.ObjectId(examId),
            status: "Completed",
          },
        },
        {
          $lookup: {
            from: "users", 
            localField: "candidateId",
            foreignField: "_id",
            as: "candidateDetails",
          },
        },
        {
          $unwind: {
            path: "$candidateDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            "candidateDetails.name": {
              $ifNull: ["$candidateDetails.name", "Deleted User"],
            },
            "candidateDetails.email": {
              $ifNull: ["$candidateDetails.email", "N/A"],
            },
            score: 1,
            totalMarks: 1,
            completedAt: 1,
            isPassed: { $gte: ["$score", exam.passingMarks] },
          },
        },
        { $sort: { score: -1, completedAt: 1 } },
      ]);

      res.render("admin/results/scoreboard", {
        title: `Scoreboard - ${exam.title}`,
        exam,
        results,
      });
    } catch (error) {
      logger.error(`Error in renderScoreboard: ${error.message}`);
      res.redirect("/admin/results?error=Server Error generating scoreboard");
    }
  }
}

module.exports = new ResultController();
