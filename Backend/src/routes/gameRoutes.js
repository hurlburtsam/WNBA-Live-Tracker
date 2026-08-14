//gameroutes.js --> API layer

import express from 'express';
import * as gameService from '../services/gameService.js';

const router = express.Router();

//Get /api/games/live
//Retrieves all in-progress games

router.get('/live', async (req,res) => {
    try {
        const liveGames = await gameService.getLiveGames();
        res.json({
            success: true,
            data:liveGames,
            count: liveGames.length,
        });
    } catch(error) {
        console.error('Error fetching live games: ', error);
        res.status(500).json({
            success:false,
            error: 'Failed to fetch live games',
            message: error.message,
        });
    }
});

//Get /api/games/:id
//Retrieves a single game with complete box score

router.get('/:id', async(req, res) => {
    try {
        const gameId = parseInt(req.params.id);

        if(isNaN(gameId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid game ID',
            });
        }

        const game = await gameService.getGameWithBoxScore(gameId);
        res.json({
            success: true,
            data: game,
        });
    } catch(error) {
        if(error.message.includes('not found')) {
            return res.status(404).jsonn({
                success: false,
                error: 'Game not found'
            });
        }

        console.error('Error fetching game: ', error);
        res.status(500).json({
            success:false,
            error: 'Failed to fetch game',
            message: error.message,
        });
    }
});

//Get /api/games/:id/leaders
//Retrieves stat leaders for both teams

router.get('/:id/leaders', async (req,res) => {
    try {
        const gameId = parseInt(req.params.id);

        if(isNaN(gameId)) {
            return res.status(400).json({
                success:false,
                error: 'Invalid game ID',
            });
        }

        const leaders = await gameService.getGameStatLeaders(gameId);
        res.json({
            success:true,
            data:leaders,
        });
    } catch(error){
        if(error.message.includes('not found')) {
            return res.status(404).json({
                success:false,
                error: 'Game not found',
            });
        }

        console.error('Error fetching game stat leaders: ', error);
    }
});

//Get/api/games/:id/team-stats
//Retrieves aggregated team stats

router.get('/:id/team-stats', async(req, res) => {
    try {
        const gameId = parseInt(req.params.id);

        if(isNaN(gameId)) {
            return res.status(400).json({
                success:false,
                error: 'Invalid game ID',
            });
        }

    const teamStats = await gameService.getGameTeamStats(gameId);
    res.json({
      success: true,
      data: teamStats,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
      });
    }

    console.error('Error fetching game team stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team stats',
      message: error.message,
    });
  }
});      

// Get /api/games/:id/details
// Retrieves compehensive game details

router.get('/:id/details', async (req, res) => {
    try {
        const gameId = parseInt(req.params.id);

        if(isNaN(gameId)) {
            return res.status(400).json({
                success:false,
                error: 'Invalid game ID',
            });
        }

        const details = await gameService.getGameDetails(gameId);
        res.json({
            success:true,
            data:details,
        });
    } catch(error) {
        if(error.message.includes('not found')) {
            return res.status(404).json({
                success:false,
                error: 'Game not found',
            });
        }

        console.error('Error fetching game details', error);
        res.status(500).json({
            success:false,
            error: 'Failed to fetch game details',
            message: error.message,
        });
    }
});

export default router;
