const mongoose = require("mongoose");
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const logger = require("../utils/logger");

class ResultApiController {
  async getExamResults(req, res) {
    try {
      const examId = req.params.examId;

      const exam = await Exam.findOne({ _id: examId, isDeleted: false });
      if (!exam) {
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });
      }

      if (
        exam.examinerId.toString() !== req.user._id.toString() &&
        req.user.role !== "SuperAdmin"
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Not authorized to view these results",
          });
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
        { $unwind: "$candidateDetails" },
        {
          $project: {
            "candidateDetails.name": 1,
            "candidateDetails.email": 1,
            score: 1,
            totalMarks: 1,
            completedAt: 1,
            isPassed: { $gte: ["$score", exam.passingMarks] },
          },
        },
        { $sort: { score: -1 } },
      ]);

      res.status(200).json({
        success: true,
        examTitle: exam.title,
        passingMarks: exam.passingMarks,
        count: results.length,
        data: results,
      });
    } catch (error) {
      logger.error(`Error in getExamResults API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}

module.exports = new ResultApiController();
