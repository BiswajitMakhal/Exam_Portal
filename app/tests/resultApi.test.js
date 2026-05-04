const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../server");
const User = require("../models/User");
const Exam = require("../models/Exam");
const Result = require("../models/Result");

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URL_TEST
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany();
  await Exam.deleteMany();
  await Result.deleteMany();
});

const generateAuthToken = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET || "supersecretkey", {
    expiresIn: "1h",
  });
};

describe("Result API Endpoints Testing", () => {
  let examiner1;
  let examiner2;
  let examiner1Token;
  let examiner2Token;
  let candidateUser;
  let testExam;

  beforeEach(async () => {
    examiner1 = await User.create({
      name: "Examiner One", email: "examiner1@test.com", password: "Pass@123", role: "Examiner"
    });
    examiner1Token = generateAuthToken(examiner1._id, examiner1.role);

    examiner2 = await User.create({
      name: "Examiner Two", email: "examiner2@test.com", password: "Pass@123", role: "Examiner"
    });
    examiner2Token = generateAuthToken(examiner2._id, examiner2.role);

    candidateUser = await User.create({
      name: "Smart Student", email: "student@test.com", password: "Pass@123", role: "Candidate"
    });

    testExam = await Exam.create({
      title: "Node.js Final", duration: 60, passingMarks: 50, examinerId: examiner1._id, status: "Active"
    });
  });


  describe("GET /api/results/exam/:examId", () => {
    
    it("should fetch exam results if user is the creator (Examiner 1)", async () => {
      await Result.create({
        examId: testExam._id,
        candidateId: candidateUser._id,
        score: 80, 
        totalMarks: 100,
        status: "Completed",
      });

      const res = await request(app)
        .get(`/api/results/exam/${testExam._id}`)
        .set("Authorization", `Bearer ${examiner1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      
      expect(res.body.data[0].score).toBe(80);
      expect(res.body.data[0].isPassed).toBe(true); 
      expect(res.body.data[0].candidateDetails.name).toBe("Smart Student");
    });

    it("should block access if Examiner tries to view another Examiner's results", async () => {
      const res = await request(app)
        .get(`/api/results/exam/${testExam._id}`)
        .set("Authorization", `Bearer ${examiner2Token}`);

      expect(res.statusCode).toBe(403); 
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Not authorized to view these results");
    });

    it("should return 404 if exam does not exist", async () => {
      const fakeExamId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/results/exam/${fakeExamId}`)
        .set("Authorization", `Bearer ${examiner1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("Exam not found");
    });
  });
});