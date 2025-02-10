import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/utils";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"] || "";
  const decoded = jwt.verify(token, JWT_SECRET);

  if (decoded) {
  } else {
    res.status(403).json({ message: "unauthorized" });
  }
};
