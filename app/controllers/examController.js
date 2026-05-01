const mongoose = require("mongoose");
const Exam = require("../models/Exam");
const logger = require("../utils/logger");

class ExamController {
  async renderExamList(req, res) {
    try {
      let matchStage = { isDeleted: false };

      if (req.user.role === "Examiner") {
        matchStage.examinerId = new mongoose.Types.ObjectId(req.user._id);
      }

      const exams = await Exam.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: "users",
            localField: "examinerId",
            foreignField: "_id",
            as: "examinerDetails",
          },
        },
        {
          $unwind: {
            path: "$examinerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            status: 1,
            duration: 1,
            passingMarks: 1,
            createdAt: 1,
            "examinerDetails.name": 1,
          },
        },
      ]);

      res.render("admin/exams/list", {
        title: "Manage Exams",
        exams,
        user: req.user,
      });
    } catch (error) {
      logger.error(`Error rendering exam list: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async renderCreateForm(req, res) {
    try {
      res.render("admin/exams/create", {
        title: "Create New Exam",
        user: req.user,
      });
    } catch (error) {
      logger.error(`Error rendering exam create form: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleCreateExam(req, res) {
    try {
      const { title, description, duration, passingMarks, status } = req.body;

      await Exam.create({
        title,
        description,
        duration,
        passingMarks,
        status,
        examinerId: req.user._id,
      });

      res.redirect("/admin/exams?success=ExamCreated");
    } catch (error) {
      logger.error(`Error creating exam from form: ${error.message}`);
      res.redirect("/admin/exams/create?error=ServerError");
    }
  }

  async renderEditForm(req, res) {
    try {
      const exam = await Exam.findOne({ _id: req.params.id, isDeleted: false });
      if (!exam) {
        return res.redirect("/admin/exams?error=ExamNotFound");
      }

      if (
        exam.examinerId.toString() !== req.user._id.toString() &&
        req.user.role !== "SuperAdmin"
      ) {
        return res.redirect("/admin/exams?error=Unauthorized");
      }

      res.render("admin/exams/edit", {
        title: "Edit Exam",
        exam,
        user: req.user,
      });
    } catch (error) {
      logger.error(`Error rendering exam edit form: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleUpdateExam(req, res) {
    try {
      const { title, description, duration, passingMarks, status } = req.body;
      const examId = req.params.id;

      const exam = await Exam.findOne({ _id: examId, isDeleted: false });
      if (!exam) return res.redirect("/admin/exams?error=ExamNotFound");

      if (
        exam.examinerId.toString() !== req.user._id.toString() &&
        req.user.role !== "SuperAdmin"
      ) {
        return res.redirect("/admin/exams?error=Unauthorized");
      }

      await Exam.findByIdAndUpdate(examId, {
        title,
        description,
        duration,
        passingMarks,
        status,
      });
      res.redirect("/admin/exams?success=ExamUpdated");
    } catch (error) {
      logger.error(`Error updating exam from form: ${error.message}`);
      res.redirect(`/admin/exams/edit/${req.params.id}?error=ServerError`);
    }
  }

  async handleDeleteExam(req, res) {
    try {
      const examId = req.params.id;
      const exam = await Exam.findOne({ _id: examId, isDeleted: false });

      if (!exam) return res.redirect("/admin/exams?error=ExamNotFound");

      if (
        exam.examinerId.toString() !== req.user._id.toString() &&
        req.user.role !== "SuperAdmin"
      ) {
        return res.redirect("/admin/exams?error=Unauthorized");
      }

      await Exam.findByIdAndUpdate(examId, { isDeleted: true });
      res.redirect("/admin/exams?success=ExamDeleted");
    } catch (error) {
      logger.error(`Error deleting exam: ${error.message}`);
      res.redirect("/admin/exams?error=ServerError");
    }
  }
}

module.exports = new ExamController();
