import express, { json, Request, Response } from "express";
import { JWT_SECRET } from "@repo/backend-common/utils";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authMiddleware } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";

const app = express();
app.use(express.json());

app.post("/signup", async (req: Request, res: Response) => {
  const parsedData = CreateUserSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect input",
    });
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
    const newUser = await prismaClient.user.create({
      data: {
        email: parsedData.data.email,
        name: parsedData.data.name,
        password: hashedPassword,
      },
    });

    const { password, ...userWithoutPassword } = newUser;
    res
      .status(201)
      .json({ user: userWithoutPassword, message: "User signup successful" });
  } catch (e: any) {
    if (e.code === "P2002") {
      res.status(409).json({ message: "User with email already exists" });
    } else {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

app.post("/signin", async (req: Request, res: Response) => {
  const parsedData = SigninSchema.safeParse(req.body);

  if (!parsedData.success) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  const { email, password } = parsedData.data;
  const user = await prismaClient.user.findFirst({
    where: { email },
  });

  if (!user || !user.password) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user?.password);
  if (!isPasswordValid) {
    res.status(400).json({ message: "Invalid password" });
  }

  try {
    const token = jwt.sign(user.id, JWT_SECRET);
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({ token, user: userWithoutPassword });
  } catch (e) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/room", authMiddleware, async (req: Request, res: Response) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Invalid data format",
    });
    return;
  }

  try {
    const userId = req.userId;
    if (!userId) {
      res.status(400).json({ message: "User ID is missing" });
      return;
    }

    const createdRoom = await prismaClient.room.create({
      data: {
        slug: parsedData.data?.name,
        adminId: userId,
      },
    });

    res.status(201).json(createdRoom);
  } catch (e) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(3001, () => {
  console.log("server running on port 3001");
});
