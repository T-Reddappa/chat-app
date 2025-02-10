import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/utils";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws, request) {
  console.log("new client connected");
  ws.on("error", console.error);

  const url = request.url;

  const queryParams = new URLSearchParams(url?.split("?")[1]);
  const token = queryParams.get("token") || "";
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded == "string") {
    ws.send("unauth");
    ws.close();
    return;
  }

  if (!decoded || !decoded.userId) {
    ws.send("unauthorixed");
    ws.close();
    return;
  }

  ws.on("message", function message(data) {
    console.log("received: %s", data);
  });
  ws.send(`${token} - ${request.url}`);
  ws.send("something");
});
