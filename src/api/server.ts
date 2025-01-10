import { app } from "./app";
import { closeDb, connectToDb } from "../config/connection";
import "dotenv/config";
import { APIERROR } from "../utils/apiError";
import { startPriceHistoryScheduler } from "../jobs/startPriceHistoryScheduler";
async function startServer() {
  try {
    await connectToDb();
    startPriceHistoryScheduler();
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    await closeDb();
    if (error instanceof APIERROR) {
      console.error(error.message);
      process.exit(1);
    }
    console.error("Failed to start the server", error);
    process.exit(1);
  }
}

startServer();
