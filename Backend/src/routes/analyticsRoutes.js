// api routes for analytics 

import express from 'express';
import * as analytcisService from '../services/analyticsService.js';

const router = express.Router();

// GET /api/analytcis/player/:id/career
// All career stats for a player

router.get('/player/:id/career', async (req,res) => {
    try {
        const player_id = parseInt(req.params.id);

        if(isNaN(player_id)) {
            return res.status(400).json({
                success:false,
                error: 'Invalid Player ID',
            });
        }

        const careerStats = await analyticsService.getPlayerCareerStats(player_id);

        res.json({
            success:true,
            data: careerStats,
        });
    } catch(error) {
        console.error('Error fetching player career stats: ', error);

        res.status(500).json({
            success:false,
            error: 'Failed to fetch player career stats',
            message: error.message,
        })
    }
});

//GET /api/analytics/player/:id/season-averages
//Includes query param for stat type

router.get('/player/:id/season-averages', async (req,res) => {
    try {
        const player_id = parseInt(req.params.id);
        const stat_type = req.query.stat_type;

        if(isNaN(player_id)) {
            return res.status(400).json({
                success:false,
                error: 'Invalid Player ID'
            });
        }

        const defaultStats = ['points', 'rebounds', 'assists'];

        const requestedStats = stat_type ? Array.isArray(req.query.stat_type)
            ? req.query.stat_type : [req.query.stat_type] : defaultStats;
        
        const seasonAverages = await analyticsService.getPlayerSeasonAverages(player_id, requestedStats);

        res.json({
            success:true,
            data:seasonAverages,
        });
    } catch(error) {
        console.error('Error fetching player season averages: ', error);

        res.status(500).json({
            success:false,
            error: 'Failed to fetch player season averages',
            message: error.message,
        });
    }
});

// GET /api/analytics/player/:id/career-high/:statType
// Career high in a stat for a player

router.get('/player/:id/career-high/stat_type', async (req, res) => {
    try {
        const player_id = parseInt(req.params.id);
        const stat_type = req.params.stat_type;

        if(isNaN(player_id)) {
            return res.json({
                success:false,
                error: 'Invalid Player ID',
            });
        }

        const careerHigh = await analyticsService.getCareerHighByStat(player_id, stat_type);

        res.json({
            success: true,
            data: careerHigh,
        });
    } catch(error) {
        console.error('Error fetching career high: ', error);

        res.status(500).json({
            success:false,
            error: 'Failed to fetch career high',
            message: error.message,
        });
    }
});

//GET /api/analytics/game/:id/on-pace
// O+players on pace for a career high

router.get('/game/:id/on-pace', async(req,res) => {
    try {
        const game_id = parseInt(req.params.id);

        if(isNaN(game_id)) {
            return status(400).json({
                success: false,
                error: 'Invalid Game ID',
            });
        }

        const players = await analyticsService.getPlayersOnPaceForCareerHigh(game_id);

        res.json({
            success:true,
            data: players,
        });
    } catch(error) {
        console.error('Error fetching on-pace players: ', error);

        return status(500).json({
            success:false,
            error: 'Failed to fetch on-pace players',
            message: error.message,
        });
    }
});

//GET/api/analytics/top-players/:stat_type
// Top players for a specific stat

router.get('/top-players/:stat_type', async (req, res) => {
    try {
        const stat_type = req.params.stat_type;
        const limit = parseInt(req.query.limit || 10);
        const leaders = await analyticsRepository.getTopPlayersForStat(stat_type, limit);

        res.json({
            success:true,
            data:leaders,
        });
    } catch(error) {
        console.error('Error fetching top players: ', error);

        res.status(500).json({
            success:false,
            error: 'Failed to fetch top players',
            message: error.message,
        });
    }
});

export default router;

