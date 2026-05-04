const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Question = require("../models/Question");

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URL_TEST ,
  );
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

describe("Bulk Upload API Endpoints", () => {
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: "Password@123",
      role: "SuperAdmin",
    });
    adminToken = generateAuthToken(adminUser._id, adminUser.role);
  });

  describe("POST /api/bulk/users", () => {
    it("should successfully upload multiple users from a CSV file", async () => {
      const csvData = `name,email,password
Test Candidate 1,candidate1@test.com,Pass@123
Test Candidate 2,candidate2@test.com,Pass@123`;

      const res = await request(app)
        .post("/api/bulk/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Cookie", [`token=${adminToken}`])
        .attach("file", Buffer.from(csvData), "users.csv");

      expect(res.statusCode).toBe(201);

      const userCount = await User.countDocuments({
        email: { $in: ["candidate1@test.com", "candidate2@test.com"] },
      });
      expect(userCount).toBe(2);
    });

    it("should reject upload if user is not authorized (e.g., Candidate role)", async () => {
      const candidateUser = await User.create({
        name: "Normal Candidate",
        email: "normal@test.com",
        password: "Password@123",
        role: "Candidate",
      });
      const candidateToken = generateAuthToken(
        candidateUser._id,
        candidateUser.role,
      );

      const csvData = `name,email\nTest,test@test.com`;

      const res = await request(app)
        .post("/api/bulk/users")
        .set("Authorization", `Bearer ${candidateToken}`)
        .set("Cookie", [`token=${candidateToken}`])
        .attach("file", Buffer.from(csvData), "users.csv");

      expect(res.statusCode).toBeGreaterThanOrEqual(401);
    });
  });

  describe("POST /api/bulk/questions/:examId", () => {
    let testExam;

    beforeEach(async () => {
      testExam = await Exam.create({
        title: "Test Exam for Bulk Questions",
        duration: 60,
        passingMarks: 40,
        examinerId: adminUser._id,
        status: "Draft",
      });
    });

    it("should successfully upload questions for an exam from a CSV file", async () => {
      const csvData = `questionText,option1,option2,option3,option4,correctOption,marks
What is 2+2?,2,3,4,5,4,2
What is the capital of India?,Delhi,Mumbai,Kolkata,Chennai,Delhi,1`;

      const res = await request(app)
        .post(`/api/bulk/questions/${testExam._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Cookie", [`token=${adminToken}`])
        .attach("file", Buffer.from(csvData), "questions.csv");

      expect(res.statusCode).toBe(201);

      const questionCount = await Question.countDocuments({
        examId: testExam._id,
      });
      expect(questionCount).toBe(2);

      const firstQuestion = await Question.findOne({
        questionText: "What is 2+2?",
      });
      expect(firstQuestion).not.toBeNull();
      expect(firstQuestion.correctOption).toBe("4");
    });

    it("should fail to upload questions if exam does not exist", async () => {
      const fakeExamId = new mongoose.Types.ObjectId(); // Ekta fake ID toiri korlam
      const csvData = `questionText,option1,option2,correctOption,marks\nTest?,A,B,A,1`;

      const res = await request(app)
        .post(`/api/bulk/questions/${fakeExamId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Cookie", [`token=${adminToken}`])
        .attach("file", Buffer.from(csvData), "questions.csv");

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
