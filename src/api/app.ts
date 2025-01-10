import express, { Express, Response, Request } from "express";
import cors from "cors";
import { router } from "./router";
export const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", router);

app.get("/health", (req: Request, res: Response) => {
  res.send("Server is up and running !!!");
});
