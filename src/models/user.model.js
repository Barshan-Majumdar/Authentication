import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true  
    },
    verified: {
        type: Boolean,
        default: false
    }
})


const userModel = mongoose.model("users", userSchema)

export default userModel