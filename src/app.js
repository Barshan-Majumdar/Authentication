import express from "express";
import morgan from "morgan";
import authRouter from "./routes/auth.route.js"; // Standard practice to keep imports at the top

const app = express();

app.use(express.json()); // Added the parentheses ()
app.use(morgan("dev"));

app.use("/api/auth", authRouter);

export default app;
