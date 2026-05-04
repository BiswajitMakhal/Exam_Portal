const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const User = require("../models/User");

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL_TEST);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany();
});

describe("User API Endpoints Testing", () => {
  describe("POST /api/users", () => {
    it("should successfully create a new user", async () => {
      const res = await request(app).post("/api/users").send({
        name: "New Admin",
        email: "admin_new@test.com",
        password: "Password@123",
        role: "SuperAdmin",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Admin");
      expect(res.body.data.email).toBe("admin_new@test.com");

      expect(res.body.data.password).toBeUndefined();

      const userInDb = await User.findOne({ email: "admin_new@test.com" });
      expect(userInDb).not.toBeNull();
      expect(userInDb.role).toBe("SuperAdmin");
    });

    it("should fail if email already exists", async () => {
      await User.create({
        name: "Existing User",
        email: "exist@test.com",
        password: "Pass@123",
        role: "Candidate",
      });

      const res = await request(app).post("/api/users").send({
        name: "Another User",
        email: "exist@test.com",
        password: "Pass@123",
        role: "Examiner",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email already exists");
    });
  });

  describe("GET /api/users", () => {
    it("should fetch all users (excluding password)", async () => {
      await User.create([
        {
          name: "User 1",
          email: "user1@test.com",
          password: "Password@123",
          role: "Candidate",
        },
        {
          name: "User 2",
          email: "user2@test.com",
          password: "Password@123",
          role: "Candidate",
        },
      ]);

      const res = await request(app).get("/api/users");

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);

      expect(res.body.data[0].password).toBeUndefined();
    });
  });

  describe("GET /api/users/:id", () => {
    it("should fetch a specific user by ID", async () => {
      const user = await User.create({
        name: "Target User",
        email: "target@test.com",
        password: "Password@123",
        role: "Candidate",
      });

      const res = await request(app).get(`/api/users/${user._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Target User");
      expect(res.body.data.password).toBeUndefined();
    });

    it("should return 404 if user not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/users/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe("User not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update a user's name and role", async () => {
      const user = await User.create({
        name: "Old Name",
        email: "update@test.com",
        password: "Password@123",
        role: "Candidate",
      });

      const res = await request(app).put(`/api/users/${user._id}`).send({
        name: "New Name Updated",
        role: "Examiner",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("New Name Updated");
      expect(res.body.data.role).toBe("Examiner");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should soft delete a user", async () => {
      const user = await User.create({
        name: "To Delete",
        email: "delete@test.com",
        password: "Password@123",
        role: "Candidate",
      });

      const res = await request(app).delete(`/api/users/${user._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User deleted successfully (Soft Delete)");

      const deletedUser = await User.findById(user._id);
      expect(deletedUser.isDeleted).toBe(true);
    });
  });
});
