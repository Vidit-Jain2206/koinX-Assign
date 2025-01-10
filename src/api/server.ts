import { app } from "./app";
import { connectToDb } from "../config/connection";
import "dotenv/config";
import { APIERROR } from "../utils/apiError";
async function startServer() {
  try {
    await connectToDb();
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    if (error instanceof APIERROR) {
      console.error(error.message);
      process.exit(1);
    }
    console.error("Failed to start the server", error);
    process.exit(1);
  }
}

startServer();
