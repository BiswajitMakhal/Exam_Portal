const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Result = require("../models/Result");

// Database connection setup
beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URL 
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
  await Result.deleteMany();
});

const generateAuthToken = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET || "supersecretkey", {
    expiresIn: "1h",
  });
};

describe("Candidate API Endpoints Testing", () => {
  let candidateToken;
  let candidateUser;
  let examinerUser;

  beforeEach(async () => {
    candidateUser = await User.create({
      name: "Test Candidate",
      email: "candidate@test.com",
      password: "Password@123",
      role: "Candidate",
    });
    candidateToken = generateAuthToken(candidateUser._id, candidateUser.role);

    examinerUser = await User.create({
      name: "Test Examiner",
      email: "examiner@test.com",
      password: "Password@123",
      role: "Examiner",
    });
  });

  
  describe("GET /api/candidate/exams", () => {
    it("should fetch all active exams for the candidate", async () => {
      await Exam.create({
        title: "Active Math Exam",
        duration: 60,
        passingMarks: 40,
        examinerId: examinerUser._id,
        status: "Active",
      });

      await Exam.create({
        title: "Draft Science Exam",
        duration: 60,
        passingMarks: 40,
        examinerId: examinerUser._id,
        status: "Draft", 
      });

      const res = await request(app)
        .get("/api/candidate/exams")
        .set("Authorization", `Bearer ${candidateToken}`);

      expect(res.statusCode).toBe(200);
      
      
      const examsArray = res.body.data || res.body; 
      expect(Array.isArray(examsArray)).toBe(true);
    });

    it("should block access if user is not a Candidate (e.g., Examiner)", async () => {
      const examinerToken = generateAuthToken(examinerUser._id, examinerUser.role);

      const res = await request(app)
        .get("/api/candidate/exams")
        .set("Authorization", `Bearer ${examinerToken}`);

      expect(res.statusCode).toBeGreaterThanOrEqual(401); 
    });
  });

  
  describe("POST /api/candidate/submit", () => {
    let testExam;
    let question1;
    let question2;

    beforeEach(async () => {
      testExam = await Exam.create({
        title: "Final Exam",
        duration: 30,
        passingMarks: 10,
        examinerId: examinerUser._id,
        status: "Active",
      });

      question1 = await Question.create({
        examId: testExam._id,
        questionText: "What is 2+2?",
        options: ["2", "3", "4", "5"],
        correctOption: "4",
        marks: 5,
      });

      question2 = await Question.create({
        examId: testExam._id,
        questionText: "What is 3+3?",
        options: ["5", "6", "7", "8"],
        correctOption: "6",
        marks: 5,
      });
    });

    it("should successfully submit an exam and calculate score", async () => {
      const payload = {
        examId: testExam._id.toString(),
        answers: [
          { questionId: question1._id.toString(), selectedOption: "4" },
          { questionId: question2._id.toString(), selectedOption: "5" } 
        ]
      };

      const res = await request(app)
        .post("/api/candidate/submit")
        .set("Authorization", `Bearer ${candidateToken}`)
        .send(payload);

      expect(res.statusCode).toBe(200); 

      const studentResult = await Result.findOne({ 
        candidateId: candidateUser._id,
        examId: testExam._id 
      });

      expect(studentResult).not.toBeNull();
      expect(studentResult.totalMarks).toBe(10); 
      expect(studentResult.score).toBe(5); 
      expect(studentResult.status).toBe("Completed");
    });
  });
});