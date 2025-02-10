import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/utils";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  userId: string;
  rooms: string[];
  ws: WebSocket;
}

const users: User[] = [];

function checkUserAuthentication(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  console.log("new client connected");
  ws.on("error", console.error);

  const url = request.url;

  const queryParams = new URLSearchParams(url?.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUserAuthentication(token);

  if (userId === null) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", function message(data) {
    console.log("received: %s", data);
    const parsedData = JSON.parse(data as unknown as string);
    if (parsedData.type === "join_room") {
      const user = users.find((u) => u.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((u) => u.ws === ws);
      if (!user) {
        return;
      }
      user.rooms = user.rooms.filter((r) => r === parsedData.room);
    }

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
  });

  ws.send(`${token} - ${request.url}`);
  ws.send("something");
});
