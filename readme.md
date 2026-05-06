# 🎓 Advanced Real-Time Exam Portal

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-B4CA65?style=for-the-badge)

A secure, high-performance web application designed to evaluate candidates through timed, structured assessments. Inspired by platforms like TestGorilla, it features real-time monitoring, automated grading, and comprehensive reporting.

🔗 **Live Demo:** [https://exam-portal-j3xw.onrender.com/](https://exam-portal-j3xw.onrender.com/)


### ⚙️ Environment Variables Setup

Create a `.env` file in the root directory and define the following variables:
```env
# Database
MONGO_URL=
# Dedicated Database for Jest Testing (Ensure the database name ends with '_test' to avoid overriding main data)
MONGO_URL_TEST=

# Authentication
JWT_SECRET=

# Cloudinary Configuration
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=

# Email Service (SMTP/Brevo)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
---

## 🚀 Features & Modules

*   **Real-time Exam Engine:** Utilizes **Socket.io** to synchronize the exam timer across devices and force auto-submission when time expires.
*   **Role-Based Access Control (RBAC):** Three distinct dashboards:
    *   **Super Admin:** Global system management and health monitoring.
    *   **Examiner/HR:** Exam creation, question banks, live monitoring, and result downloads.
    *   **Candidate/Student:** Secure testing environment with live timer.
*   **Advanced Question Management:** Supports MCQs with rich media (images via Cloudinary). Includes **Soft Delete** to preserve historical exam records.
*   **Bulk Operations:** Bulk upload for Candidates and Questions using CSV parsing.
*   **Automated Emailing:** Custom HTML email templates via **Nodemailer** for exam invites and result scorecards.
*   **Analytics & Reporting:** Generates detailed performance metrics using complex MongoDB Aggregations and Lookups.
*   **Bank-Level Security:** Rate Limiting (DDoS protection), Helmet.js, strict CORS, and robust JWT/Cookie-based authentication.

---

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (Mongoose)
*   **Frontend/Views:** EJS (Embedded JavaScript Templates), Bootstrap 5
*   **Real-time Communication:** Socket.io
*   **File Handling:** Multer, CSVtoJSON
*   **Cloud Storage:** Cloudinary (for question images)
*   **Email Service:** Brevo (formerly Sendinblue) / Nodemailer
*   **Documentation:** Swagger UI / Swagger JsDoc
*   **Logging:** Winston (Daily rotating logs), Request Logger

---

## 🔐 Demo Credentials

Use the following credentials to test the role-based dashboards:

* **Role:** Super Admin  |  **Email:**    admin@demo.com  |  **Password:** Admin@123
* **Role:** Examiner     |  **Email:**   teacher@demo.com |  **Password:** Teacher@123

> **Note:** To test the **Candidate** dashboard, you can simply register a new account directly from the portal's signup page.

## 📂 Folder Structure

Strict MVC pattern implementation for clean code separation.
```text

.
├── app/
│   ├── config/         # Database and third-party configuration
│   ├── controllers/    # Request handlers and business logic
│   │   ├── admin/      # Controllers for SuperAdmin & Examiner actions
│   │   ├── auth/       # Controllers for Registration, Login, etc.
│   │   └── candidate/  # Controllers for Candidate exam dashboard
│   ├── middleware/     # Auth, Error handling, Rate limiting, Uploads
│   ├── models/         # Mongoose schema definitions
│   ├── routes/         # Express routing
│   │   ├── api/        # REST API endpoints (Returns JSON/Swagger)
│   │   └── web/        # Web routes (Renders EJS Templates)
│   ├── socket/         # Socket.io event handlers
│   ├── tests/          # Jest unit and integration tests for APIs
│   ├── utils/          # Helper functions (Cloudinary, Email templates, Logger)
│   └── webservice/     # Swagger documentation schemas
│       ├── admin/      # Swagger docs for Admin APIs
│       ├── auth/       # Swagger docs for Auth APIs
│       └── candidate/  # Swagger docs for Candidate APIs
├── public/
│   └── js/             # Client-side scripts (Socket events, UI interactions)
├── views/
│   ├── admin/          # EJS templates for Super Admin & Examiner
│   ├── layouts/        # Reusable EJS components (Header, Footer, Navbar)
│   └── student/        # EJS templates for Candidate dashboard and Live Exam
├── .env                # Environment variables
├── server.js           # Application entry point
└── package.json