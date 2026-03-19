import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { access } from "fs";



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

  const accessToken = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  const refreshToken = jwt.sign({
    id: user._id
  }, config.JWT_SECRET,
    {
    expiresIn: "7d"
    })
  
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })

  res.status(201).json({
    message: "User registered successfully !",
    user: {
      username: user.username,
      email: user.email,
      accessToken: accessToken
    },
  });
}

export async function getMe(req, res) {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        return res.json({
            message: "token not found !"
        })
    }

    const decoded = jwt.verify(token, config.JWT_SECRET)
    console.log(decoded);
    

    const user = await userModel.findById(decoded.id)
    console.log(user)

    if (!user) {
        return res.status(404).json("User not found !")
    }

    res.status(200).json({
        message: "USer fetched successfully !",
        user: {
            username: user.username,
            email: user.email
        }
    })
}
