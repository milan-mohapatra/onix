const _ = require("lodash");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { User } = require("../models/user.model.js");
const { asyncHandler, CustomError, CustomValidationError } = require("../utils/error.util.js");
const { ROLES } = require("../constants/miscellaneous.js");
const { generateToken, generatePayload } = require("../utils/auth.util.js");
const { errorMessage } = require("../constants/message.js");

const userController = {};

/*
POST /api/auth/signup
Auth: NO
Access: NA
*/
userController.signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomValidationError(errors.array(), 400)
  }

  // file validation pending
  const body = _.pick(req.body, ["name", "email", "password"]);
  // body.name = body.name.toLowerCase()
  // add file upload in future
  // avatar = multer file upload

  const user = new User(body);

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(user.password, salt);
  user.password = hashedPassword;

  const isFirstUser = (await User.countDocuments()) === 0 ? true : false;

  if (isFirstUser) {
    await User.create({name: "former user", email: "onix@gmail.com"})
    user.role = ROLES.ADMIN;
  }

  await user.save();

  const token = generateToken(generatePayload(user));

  if (!token.success) {
    throw new CustomError(token.message, token.statusCode);
  }

  res.status(201).json({ token: token.data });
});

/*
POST /api/auth/login
Auth: NO
Access: NA
*/
userController.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomValidationError(errors.array(), 400)
  }
  
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError(
      errorMessage.invalidEmailPassword.message,
      errorMessage.invalidEmailPassword.statusCode
    );
  }

  const comparePassword = await bcrypt.compare(password, user.password);

  if (!comparePassword) {
    throw new CustomError(
      errorMessage.invalidEmailPassword.message,
      errorMessage.invalidEmailPassword.statusCode
    );
  }

  const token = generateToken(generatePayload(user));

  if (!token.success) {
    throw new CustomError(token.message, token.statusCode);
  }

  res.status(201).json({ token: token.data });
});

/*
POST /api/auth/logout
Auth: yes
Access: private
*/
userController.logout = asyncHandler(async (req, res) => {
  res.json({ token: "" });
});

module.exports = { userController };