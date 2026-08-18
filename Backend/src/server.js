import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import gameRoutes from './routes/gameRoutes.js';
import analyticsRoutes from '/routes/analyticsRoutes.js';

dotenv.config();

const app = express();
app.use(cors({origin: process.env.CLIENT_ORIGIN}));
app.use(express.json());
app.use('/api/games', gameRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});

const PORT = process.env.PORT || 4000;
app.listen(PORT,() => {
    console.log(`Server running on http://localhost:${PORT}`);
});
