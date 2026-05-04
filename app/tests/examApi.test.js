const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../models/User");
const Exam = require("../models/Exam");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany();
  await Exam.deleteMany();
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

describe("Exam API Endpoints Testing", () => {
  let examinerUser;
  let examinerToken;
  let candidateUser;
  let candidateToken;

  beforeEach(async () => {
    examinerUser = await User.create({
      name: "Test Examiner",
      email: "examiner@test.com",
      password: "Password@123",
      role: "Examiner",
    });
    examinerToken = generateAuthToken(examinerUser._id, examinerUser.role);

    candidateUser = await User.create({
      name: "Test Candidate",
      email: "candidate@test.com",
      password: "Password@123",
      role: "Candidate",
    });
    candidateToken = generateAuthToken(candidateUser._id, candidateUser.role);
  });

  describe("POST /api/exams", () => {
    it("should create a new exam if user is Examiner", async () => {
      const res = await request(app)
        .post("/api/exams")
        .set("Authorization", `Bearer ${examinerToken}`)
        .send({
          title: "JavaScript Basics Test",
          description: "Basic JS concepts exam",
          duration: 60,
          passingMarks: 40,
          status: "Draft",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("JavaScript Basics Test");

      // Check in DB
      const examInDb = await Exam.findById(res.body.data._id);
      expect(examInDb).not.toBeNull();
      expect(examInDb.examinerId.toString()).toBe(examinerUser._id.toString());
    });

    it("should reject exam creation if user is Candidate", async () => {
      const res = await request(app)
        .post("/api/exams")
        .set("Authorization", `Bearer ${candidateToken}`)
        .send({
          title: "Hacked Exam",
          duration: 30,
          passingMarks: 10,
        });

      expect(res.statusCode).toBeGreaterThanOrEqual(401);
    });
  });

  describe("GET /api/exams", () => {
    it("should fetch all exams that are not deleted", async () => {
      await Exam.create({
        title: "Exam 1",
        duration: 60,
        passingMarks: 40,
        examinerId: examinerUser._id,
      });
      await Exam.create({
        title: "Exam 2",
        duration: 45,
        passingMarks: 30,
        examinerId: examinerUser._id,
      });

      const res = await request(app)
        .get("/api/exams")
        .set("Authorization", `Bearer ${examinerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe("GET /api/exams/:id", () => {
    it("should fetch a specific exam by ID", async () => {
      const exam = await Exam.create({
        title: "Specific Exam",
        duration: 90,
        passingMarks: 50,
        examinerId: examinerUser._id,
      });

      const res = await request(app)
        .get(`/api/exams/${exam._id}`)
        .set("Authorization", `Bearer ${examinerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Specific Exam");
    });
  });

  describe("PUT /api/exams/:id", () => {
    it("should update an existing exam", async () => {
      const exam = await Exam.create({
        title: "Old Title",
        duration: 60,
        passingMarks: 40,
        examinerId: examinerUser._id,
      });

      const res = await request(app)
        .put(`/api/exams/${exam._id}`)
        .set("Authorization", `Bearer ${examinerToken}`)
        .send({
          title: "New Updated Title",
          duration: 120,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("New Updated Title");
      expect(res.body.data.duration).toBe(120);
    });
  });

  describe("DELETE /api/exams/:id", () => {
    it("should soft delete an exam", async () => {
      const exam = await Exam.create({
        title: "To Be Deleted",
        duration: 60,
        passingMarks: 40,
        examinerId: examinerUser._id,
      });

      const res = await request(app)
        .delete(`/api/exams/${exam._id}`)
        .set("Authorization", `Bearer ${examinerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Exam deleted successfully (Soft Delete)");

      const deletedExam = await Exam.findById(exam._id);
      expect(deletedExam.isDeleted).toBe(true);
    });
  });
});
