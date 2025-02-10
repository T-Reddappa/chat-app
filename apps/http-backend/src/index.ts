import express from "express";
import { JWT_SECRET } from "@repo/backend-common/utils";
import { authMiddleware } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();

app.post("/signup", (req, res) => {});

app.post("/signin", () => {});

app.post("/room", authMiddleware, () => {});

app.listen(3001, () => {
  console.log("server running on port 3000");
});
