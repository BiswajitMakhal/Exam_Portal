const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Question = require("../models/Question");

jest.mock("../utils/cloudinaryUpload", () => {
  return jest.fn().mockResolvedValue({
    secure_url: "https://fake-cloudinary.com/image.jpg",
    public_id: "fake_public_id_123",
  });
});

const cloudinary = require("../config/cloudinary");
cloudinary.uploader.destroy = jest.fn().mockResolvedValue({ result: "ok" });

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany();
  await Exam.deleteMany();
  await Question.deleteMany();
});

const generateAuthToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || "supersecretkey",
    {
      expiresIn: "1h",
    },
  );
};

describe("Question API Endpoints Testing", () => {
  let examinerUser;
  let examinerToken;
  let testExam;

  beforeEach(async () => {
    examinerUser = await User.create({
      name: "Test Examiner",
      email: "examiner@test.com",
      password: "Password@123",
      role: "Examiner",
    });
    examinerToken = generateAuthToken(examinerUser._id, examinerUser.role);

    testExam = await Exam.create({
      title: "Test Exam",
      duration: 60,
      passingMarks: 40,
      examinerId: examinerUser._id,
      status: "Active",
    });
  });

  describe("GET /api/questions/exam/:examId", () => {
    it("should fetch all questions for a specific exam", async () => {
      await Question.create({
        examId: testExam._id,
        questionText: "Q1",
        options: ["A", "B"],
        correctOption: "A",
      });
      await Question.create({
        examId: testExam._id,
        questionText: "Q2",
        options: ["X", "Y"],
        correctOption: "Y",
      });

      const res = await request(app)
        .get(`/api/questions/exam/${testExam._id}`)
        .set("Authorization", `Bearer ${examinerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe("POST /api/questions", () => {
    it("should create a question with text and options (No Image)", async () => {
      const res = await request(app)
        .post("/api/questions")
        .set("Authorization", `Bearer ${examinerToken}`)
        .field("examId", testExam._id.toString())
        .field("questionText", "What is the capital of France?")
        .field("options", JSON.stringify(["Paris", "London", "Berlin", "Rome"]))
        .field("correctOption", "Paris")
        .field("marks", 5);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questionText).toBe("What is the capital of France?");
      expect(res.body.data.options[0]).toBe("Paris");
    });

    it("should create a question WITH a mock image file", async () => {
      const buffer = Buffer.from("fake-image-content");

      const res = await request(app)
        .post("/api/questions")
        .set("Authorization", `Bearer ${examinerToken}`)
        .field("examId", testExam._id.toString())
        .field("questionText", "Identify this picture")
        .field("options", JSON.stringify(["Option A", "Option B"]))
        .field("correctOption", "Option A")
        .field("marks", 5)
        .attach("image", buffer, "test-image.jpg");

      expect(res.statusCode).toBe(201);
      expect(res.body.data.imageUrl).toBe(
        "https://fake-cloudinary.com/image.jpg",
      );
      expect(res.body.data.imagePublicId).toBe("fake_public_id_123");
    });
  });

  describe("PUT /api/questions/:id", () => {
    it("should update a question text successfully", async () => {
      const question = await Question.create({
        examId: testExam._id,
        questionText: "Old Question",
        options: ["1", "2"],
        correctOption: "1",
      });

      const res = await request(app)
        .put(`/api/questions/${question._id}`)
        .set("Authorization", `Bearer ${examinerToken}`)
        .field("questionText", "New Updated Question")
        .field("correctOption", "2");

      expect(res.statusCode).toBe(200);
      expect(res.body.data.questionText).toBe("New Updated Question");
      expect(res.body.data.correctOption).toBe("2");
    });
  });

  describe("DELETE /api/questions/:id", () => {
    it("should soft delete a question and clear image details", async () => {
      const question = await Question.create({
        examId: testExam._id,
        questionText: "Question to delete",
        options: ["A", "B"],
        correctOption: "A",
        imageUrl: "http://real-url.com",
        imagePublicId: "real-public-id",
      });

      const res = await request(app)
        .delete(`/api/questions/${question._id}`)
        .set("Authorization", `Bearer ${examinerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Question deleted successfully");

      const deletedQ = await Question.findById(question._id);
      expect(deletedQ.isDeleted).toBe(true);
      expect(deletedQ.imageUrl).toBeNull();
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        "real-public-id",
      );
    });
  });
});
