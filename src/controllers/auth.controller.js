import userModel from "../models/user.model.js";
import crypto from "crypto"
import jwt from "jsonwebtoken"
import config from "../config/config.js";

export async function register(req, res) {
    const { username, email, password } = req.body;

    const isUserExists = await userModel.findOne({
        $or: [
            {username}, {email}
        ]
    })

    if (isUserExists) {
        res.status(409).json({
            message: "User already exists !!"
        })
    }

    const hashedPass = crypto.createHash("sha256").update(password).digest("hex")

    const user = userModel.create({
        username,
        email,
        password: hashedPass
    })

    const token = jwt.sign({
        id: user._id
    }, config.JWT_SECRET, {
        expiresIn: "1d"
    })

    res.status(201).json({
        message: "User registered successfully !",
        user: {
            username: (await user).username,
            email: (await user).email
        }
    })

}

