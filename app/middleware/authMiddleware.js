const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    if (req.originalUrl.startsWith("/api")) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    } else {
      return res.redirect("/login");
    }
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecretkey",
    );
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user || req.user.isDeleted) {
      throw new Error("User deleted or not found");
    }

    res.locals.user = req.user;

    next();
  } catch (error) {
    if (req.originalUrl.startsWith("/api")) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
    } else {
      return res.redirect("/login");
    }
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      if (req.originalUrl.startsWith("/api")) {
        return res
          .status(403)
          .json({ success: false, message: "User role not authorized" });
      } else {
        return res.status(403).send("Access Denied");
      }
    }
    next();
  };
};

module.exports = { protect, authorize };
