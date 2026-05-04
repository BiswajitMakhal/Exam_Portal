const mongoose = require("mongoose");
const Exam = require("../../models/Exam");
const Question = require("../../models/Question");
const Result = require("../../models/Result");
const logger = require("../../utils/logger");

const sendEmail = require("../../utils/emailSender");
const { generateReportCardHTML } = require("../../utils/emailTemplates");

class CandidateController {
  async renderDashboard(req, res) {
    try {
      const exams = await Exam.find({
        status: "Active",
        isDeleted: false,
      }).sort({ createdAt: -1 });
      res.render("student/dashboard", {
        title: "Student Dashboard",
        exams,
        error: req.query.error,
      });
    } catch (error) {
      logger.error(`Error loading student dashboard: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async renderLiveExam(req, res) {
    try {
      const examId = req.params.examId;
      const userId = req.user ? req.user._id : req.locals.user._id;

      const existingResult = await Result.findOne({
        examId,
        candidateId: userId,
      });

      if (existingResult) {
        return res.redirect(`/student/exam/success/${existingResult._id}`);
      }

      const exam = await Exam.findOne({
        _id: examId,
        status: "Active",
        isDeleted: false,
      });

      if (!exam) {
        return res.redirect(
          "/student/dashboard?error=Exam not found or inactive",
        );
      }

      const questions = await Question.find({ examId });

      res.render("student/live-exam", {
        title: `Live Exam - ${exam.title}`,
        exam,
        questions,
      });
    } catch (error) {
      logger.error(`Error loading live exam: ${error.message}`);
      res.redirect("/student/dashboard?error=Server Error");
    }
  }

  async submitExam(req, res) {
    try {
      const { examId, answers } = req.body;
      const user = req.user ? req.user : req.locals.user;
      const userId = user._id;

      const existingResult = await Result.findOne({
        examId,
        candidateId: userId,
      });
      if (existingResult) {
        return res.redirect(`/student/exam/success/${existingResult._id}`);
      }

      const exam = await Exam.findById(examId);
      const questions = await Question.find({ examId });

      let score = 0;
      let totalMarks = 0;

      questions.forEach((q) => {
        totalMarks += q.marks;
        const studentAnswer = answers ? answers[q._id.toString()] : null;

        if (studentAnswer && studentAnswer === q.correctOption) {
          score += q.marks;
        }
      });

      const isPassed = score >= exam.passingMarks;

      const result = await Result.create({
        examId,
        candidateId: userId,
        score,
        totalMarks,
        isPassed,
        status: "Completed",
        completedAt: Date.now(),
      });

      try {
        const emailHtml = generateReportCardHTML(
          user.name,
          exam.title,
          score,
          totalMarks,
        );

        sendEmail({
          to: user.email,
          subject: `📝 Your Result Report Card: ${exam.title}`,
          html: emailHtml,
        });

        logger.info(`Report card email triggered for ${user.email}`);
      } catch (emailErr) {
        logger.error(
          `Report card email failed to trigger: ${emailErr.message}`,
        );
      }

      res.redirect(`/student/exam/success/${result._id}`);
    } catch (error) {
      logger.error(`Error submitting exam: ${error.message}`);
      res.redirect(
        "/student/dashboard?error=Error occurred while submitting exam.",
      );
    }
  }

  async renderSuccess(req, res) {
    try {
      const resultId = req.params.resultId;

      const resultData = await Result.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(resultId) } },
        {
          $lookup: {
            from: "exams",
            localField: "examId",
            foreignField: "_id",
            as: "examDetails",
          },
        },
        { $unwind: "$examDetails" },
      ]);

      if (!resultData || resultData.length === 0) {
        return res.redirect("/student/dashboard");
      }

      const result = resultData[0];
      result.examId = result.examDetails;

      res.render("student/success", { title: "Exam Completed", result });
    } catch (error) {
      logger.error(`Error loading success page: ${error.message}`);
      res.redirect("/student/dashboard");
    }
  }
}

module.exports = new CandidateController();
