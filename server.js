
import app from "./src/app.js";
import connectDB from "./src/DB/db.js"

app.listen(3000, () => {
  console.log("Server Started at port 3000");
  connectDB();
});

