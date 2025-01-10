import { Router } from "express";
import {
  getDeviatons,
  getRecentStats,
} from "../../controllers/coinsController";

export const v1Router: Router = Router();

v1Router.get("/deviation", getDeviatons);
v1Router.get("/stats", getRecentStats);
