import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";

export async function register(req, res) {
  const { username, email, password } = req.body;

  const isUserExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserExists) {
    res.status(409).json({
      message: "User already exists !!",
    });
  }

  const hashedPass = crypto.createHash("sha256").update(password).digest("hex");

  // const hashedPass = await bcrypt.hash(password, 10)  -- this can also be used here

  const user = await userModel.create({
    username,
    email,
    password: hashedPass,
  });

  /** 
  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.create({
    user: user._id,
    refreshTokenHash: refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = jwt.sign(
    {
      id: user._id,
      sessionId: session._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
*/

  const otp = generateOtp();
  const html = getOtpHtml(otp);

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  await otpModel.create({
    email,
    user: user._id,
    otpHash,
  });

  await sendEmail(email, "OTP Verification", `Your OTP is ${otp}`, html);

  res.status(201).json({
    message: "User registered successfully !",
    user: {
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(401).json({
      message: "Email not found with this user !",
    });
  }

  if (!user.verified) {
    return res.status(401).json({
      message: "Email not verified ! Please verify it first ",
    });
  }

  const passwordHash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  const isPasswordValid = passwordHash === user.password;

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Password not valid !",
    });
  }

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.create({
    user: user._id,
    refreshTokenHash: refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "Logged in successfully !",
    user: {
      id: user._id,
      email: user.email,
      verified: user.verified,
    },
    accessToken: accessToken,
  });
}

export async function getMe(req, res) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.json({
      message: "token not found !",
    });
  }

  const decoded = jwt.verify(token, config.JWT_SECRET);
  console.log(decoded);

  const user = await userModel.findById(decoded.id);
  console.log(user);

  if (!user) {
    return res.status(404).json("User not found !");
  }

  res.status(200).json({
    message: "USer fetched successfully !",
    user: {
      username: user.username,
      email: user.email,
    },
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token not found !!",
    });
  }

  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.findOne({
    refreshTokenHash,
    revoke: false,
  });

  if (!session) {
    return res.status(400).json({
      message: "Invalid refresh token !",
    });
  }

  const accessToken = jwt.sign(
    {
      id: decoded.id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  const newRefreshToken = jwt.sign(
    {
      id: decoded.id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");
  session.refreshTokenHash = newRefreshTokenHash;
  await session.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: "Access token generated succesfully !!",
    accessToken,
  });
}

export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh Token not Found !!",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.findOne({
    refreshTokenHash,
    revoked: false,
  });

  if (!session) {
    return res.status(400).json({
      message: "Refresh token not valid !",
    });
  }

  session.revoked = true;
  console.log("Is Mongoose Document:", session instanceof mongoose.Document);
  await session.save();

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "User logged out successfully !",
  });
}

export async function logoutAll(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found !!",
    });
  }

  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

  await sessionModel.updateMany(
    {
      user: decoded.id,
      revoked: false,
    },
    {
      revoked: true,
    },
  );
  res.clearCookie("refreshToken");
  res.status(200).json({
    message: "Logged out from all devices !!",
  });
}

export async function verifyEmail(req, res) {
  const { otp, email } = req.body;
  if (!otp) {
    return res.status(400).json({
      message: "Please provide an OTP !",
    });
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  const otpDoc = await otpModel.findOne({
    email,
    otpHash,
  });

  if (!otpDoc) {
    return res.status(400).json({
      message: "Invalid OTP !",
    });
  }

  const user = await userModel.findByIdAndUpdate(
    otpDoc.user,
    {
      verified: true,
    },
    { new: true },
  );

  await otpModel.deleteMany({
    user: otpDoc.user,
  });

  res.status(200).json({
    message: "Email verified successfully !",
    user: user,
  });
}
