require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const dbConnection = require("./app/config/db");
const { initSocket } = require("./app/socket/socket");
const logger = require("./app/utils/logger");
const requestLogger = require("./app/middleware/requestLogger");
const cookieParser = require("cookie-parser");

// Routes Imports
const userRoutes = require("./app/routes/admin/userRoutes");
const userApiRoutes = require("./app/routes/api/userApiRoutes");
const authRoutes = require("./app/routes/admin/authRoute");
const authApiRoutes = require("./app/routes/api/authApiRoutes");
const examRoutes = require("./app/routes/admin/examRoutes");
const examApiRoutes = require("./app/routes/api/examApiRoutes");
const questionRoutes = require("./app/routes/admin/questionRoutes");
const questionApiRoutes = require("./app/routes/api/questionApiRoute");
const bulkRoutes = require("./app/routes/admin/bulkRoutes");
const bulkApiRoutes = require("./app/routes/api/bulkApiRoutes");
const candidateRoutes = require("./app/routes/admin/candidateRoute");
const candidateApiRoutes = require("./app/routes/api/candidateApiRoutes");
const resultRoutes = require("./app/routes/admin/resultRoutes");
const resultApiRoutes = require("./app/routes/api/resultApiRoutes");
const dashboardRoutes = require("./app/routes/admin/dashboardRoutes");

const app = express();
const server = http.createServer(app);

initSocket(server);
dbConnection();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(requestLogger);
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: "Too many login attempts, please try again after 10 minutes.",
});

app.use("/login", loginLimiter);
app.use("/", loginLimiter);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Advanced Exam Portal API",
      version: "1.0.0",
      description: "REST API documentation for the Exam Portal",
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
  },
  apis: ["./app/routes/api/*.js", "./app/webservice/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Auth Routes
app.use("/", authRoutes);
app.use("/api/auth", authApiRoutes);

// Admin / Examiner Web Routes
app.use("/admin/users", userRoutes);
app.use("/admin/exams", examRoutes);
app.use("/admin/questions", questionRoutes);
app.use("/admin/bulk", bulkRoutes);
app.use("/admin/results", resultRoutes);
app.use("/admin/dashboard", dashboardRoutes);

app.use("/student", candidateRoutes);

// REST API Routes
app.use("/api/users", userApiRoutes);
app.use("/api/exams", examApiRoutes);
app.use("/api/questions", questionApiRoutes);
app.use("/api/bulk", bulkApiRoutes);
app.use("/api/candidate", candidateApiRoutes);
app.use("/api/results", resultApiRoutes);

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).send("Page or API not found");
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Server Error: ${err.message} \nStack: ${err.stack}`);
  res.status(500).send("Internal Server Error");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});
