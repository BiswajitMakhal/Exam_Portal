const Joi = require("joi");

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage =
  "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";

const authValidation = {
  registerSchema: Joi.object({
    name: Joi.string().min(3).max(50).required().messages({
      "string.empty": "Name cannot be empty",
      "string.min": "Name must have at least 3 characters",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
    }),
    password: Joi.string().pattern(passwordPattern).required().messages({
      "string.pattern.base": passwordMessage,
    }),
    confirmPassword: Joi.any().valid(Joi.ref("password")).optional().messages({
      "any.only": "Confirm password does not match",
    }),
  }),

  loginSchema: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  resetPasswordLinkSchema: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPasswordSchema: Joi.object({
    password: Joi.string().pattern(passwordPattern).required().messages({
      "string.pattern.base": passwordMessage,
    }),
    confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
      "any.only": "Passwords do not match",
    }),
  }),
};

module.exports = authValidation;
