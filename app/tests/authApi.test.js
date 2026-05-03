const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server"); 
const User = require("../models/User"); 

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
});

describe("Auth API Endpoints Testing", () => {

  describe("POST /api/auth/register", () => {
    it("should successfully register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test Candidate",
        email: "testcandidate@example.com",
        password: "Password@123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Registration successful. Please log in.");
      
      const userInDb = await User.findOne({ email: "testcandidate@example.com" });
      expect(userInDb).not.toBeNull();
      expect(userInDb.name).toBe("Test Candidate");
      expect(userInDb.role).toBe("Candidate");
    });

    it("should fail to register if email already exists", async () => {
      await User.create({
        name: "Existing User",
        email: "exist@example.com",
        password: "Password@123",
        role: "Candidate"
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "New User",
        email: "exist@example.com", 
        password: "NewPassword@123",
      });

      expect(res.statusCode).toBe(400); 
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("User already exists with this email");
    });
  });

  describe("POST /api/auth/login", () => {
    
    beforeEach(async () => {
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("CorrectPass123!", salt);

      await User.create({
        name: "Login Test User",
        email: "logintest@example.com",
        password: hashedPassword,
        role: "Candidate"
      });
    });

    it("should login successfully with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@example.com",
        password: "CorrectPass123!",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("token"); 
      expect(res.body.role).toBe("Candidate");
    });

    it("should fail to login with wrong password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "logintest@example.com",
        password: "WrongPassword999",
      });

      expect(res.statusCode).toBe(401); 
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const res = await request(app).get("/api/auth/logout");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Logged out successfully");
    });
  });

});