const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(" | ");

      if (req.originalUrl.startsWith("/api")) {
        return res.status(400).json({ success: false, message: errorMessage });
      } else {
        const backUrl = req.headers.referer || "/login";
        const cleanUrl = backUrl.split("?")[0];
        return res.redirect(
          `${cleanUrl}?error=${encodeURIComponent(errorMessage)}`,
        );
      }
    }

    next();
  };
};

module.exports = validateRequest;
