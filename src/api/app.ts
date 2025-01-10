import express, { Express } from "express";
import cors from "cors";
import { router } from "./router";
export const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", router);
