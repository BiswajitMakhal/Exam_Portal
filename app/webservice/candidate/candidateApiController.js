const mongoose = require("mongoose");
const Exam = require("../../models/Exam");
const Question = require("../../models/Question");
const Result = require("../../models/Result");
const logger = require("../../utils/logger");

class CandidateApiController {
  async getAvailableExams(req, res) {
    try {
      const candidateId = new mongoose.Types.ObjectId(req.user._id);

      const exams = await Exam.aggregate([
        { $match: { status: "Active", isDeleted: false } },
        {
          $lookup: {
            from: "results",
            let: { exam_id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$examId", "$$exam_id"] },
                      { $eq: ["$candidateId", candidateId] },
                    ],
                  },
                },
              },
            ],
            as: "attemptDetails",
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            duration: 1,
            passingMarks: 1,
            isAttempted: { $gt: [{ $size: "$attemptDetails" }, 0] },
            resultStatus: { $arrayElemAt: ["$attemptDetails.status", 0] },
          },
        },
      ]);

      res.status(200).json({ success: true, count: exams.length, data: exams });
    } catch (error) {
      logger.error(`Error in getAvailableExams API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async submitExam(req, res) {
    try {
      const { examId, answers } = req.body;
      const candidateId = req.user._id;

      const existingResult = await Result.findOne({
        examId,
        candidateId,
        status: "Completed",
      });
      if (existingResult) {
        return res
          .status(400)
          .json({ success: false, message: "Exam already submitted" });
      }

      const questions = await Question.find({ examId, isDeleted: false });

      let score = 0;
      let totalMarks = 0;

      const formattedAnswers = answers.map((ans) => {
        const question = questions.find(
          (q) => q._id.toString() === ans.questionId,
        );
        if (question) {
          totalMarks += question.marks;
          if (question.correctOption === ans.selectedOption) {
            score += question.marks;
          }
        }
        return {
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
        };
      });

      questions.forEach((q) => {
        const isAnswered = answers.find(
          (a) => a.questionId === q._id.toString(),
        );
        if (!isAnswered) {
          totalMarks += q.marks;
        }
      });

      const resultData = {
        examId,
        candidateId,
        answers: formattedAnswers,
        score,
        totalMarks,
        status: "Completed",
        completedAt: Date.now(),
      };

      const finalResult = await Result.findOneAndUpdate(
        { examId, candidateId },
        resultData,
        { new: true, upsert: true },
      );

      res.status(200).json({
        success: true,
        data: finalResult,
        message: "Exam submitted successfully",
      });
    } catch (error) {
      logger.error(`Error in submitExam API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}

module.exports = new CandidateApiController();
