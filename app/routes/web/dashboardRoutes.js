const express = require("express");
const router = express.Router();
const DashboardController = require("../../controllers/admin/dashboardController");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.use(authorize("SuperAdmin", "Examiner"));

router.get("/", DashboardController.renderDashboard);

module.exports = router;
