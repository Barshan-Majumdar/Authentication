import mongoose from "mongoose";

const blcTokenSchema = mongoose.Schema({
    token: {
        type: String,
        required
    }
})

const blcTokenModel = mongoose.model("BlackListed Tokens", blcTokenSchema)
export default blcTokenModel