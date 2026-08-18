import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import gameRoutes from "./routes/gameRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { startLiveSyncJob } from "./jobs/liveSyncJob.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/api/games", gameRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinGame", (gameId) => {
    socket.join(`game:${gameId}`);
    console.log(`Socket ${socket.id} joined game ${gameId}`);
  });

  socket.on("leaveGame", (gameId) => {
    socket.leave(`game:${gameId}`);
    console.log(`Socket ${socket.id} left game ${gameId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startLiveSyncJob(io, { intervalMs: 15000 });
});