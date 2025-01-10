import { Router } from "express";
import { v1Router } from "./v1";

export const router: Router = Router();

router.use("/v1", v1Router);
