// Websocket server

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'
import { Server } from 'socket.io';

import gameRoutes from './routes/gameRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { startLiveSyncJob } from './jobs/liveSyncJob.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new server(server, {
    cors: {
        orgin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
        methods: ['GET', 'POST'],
    },
});

app.use(cors({
    origin:process.env.CLIENT_ORIGIN || 'http://localhost:5173'
}
));
app.use(express.json());

app.get("/health", (req,res) => {
    res.json({status:'ok'});
});

app.set("io", io);

io.on("connection", (socket) => {
    console.log('Client connected: ', socket.id);

    socket.on('joinGame', (game_id) => {
        socket.join(`game: ${game_id}`);
        console.log(`Socket ${socket.id} joined game ${game_id}`);
    });

    socket.on('leaveGame', (game_id) => {
        socket.leave(`game: ${game_id}`);
        console.log(`Socket ${socket.id} leaving game ${game_id}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected: ', socket.id)
    });
});

// Helper used by sync calls to broadcast to live game clients

export function emitGameUpdates(game_id, payload) {
    io.to(`game:${game_id}`).emit("game:update", payload);
}

export function emitLiveGames(payload) {
    io.emit("games:live", payload);
}

const PORT = proces.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startLiveSyncJob(io, { intervalMs: 15000 });
});