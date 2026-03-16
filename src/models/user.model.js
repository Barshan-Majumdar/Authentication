import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: stringify,
        require: true,
        unique: true
    },
    email: {
        type: string,
        required: true,
        unique: true
    },
    password: {
        type: stringify,
        required: true  
    }
})


const userModel = mongoose.model("users", userSchema)

export default userModel