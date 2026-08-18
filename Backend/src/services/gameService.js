//gameService.js

import * as gameRepository from '../repositories/gameRepository.js';
import * as playerGameStatsRepository from '../repositories/playerGameStatsRepository.js';

/**
 * Get a single game with its complete box score
 * @param {number} gameId - Database game ID
 * @returns {Object} Game object with boxScore array
 */

export async function getGameWithBoxScore(gameId) {
    try {
        const game = await gameRepository.getGamebyId(gameId);

        if(!game) {
            throw new Error(`Game ${gameId} not found`);
        }

        const boxScore = await playerGameStatsRepository.getBoxScorebyGameId(gameId);

        return {
            ...game,
            boxScore: boxScore || [],
        };
    } catch(error) {
        console.error('Error getting game with box score: ', error);
        throw error;
    }
}

/**
 * Get all live games (currently in progress)
 * @returns {Array} Array of game objects with status='live'
 */

export async function getLiveGames() {
    try{
        const liveGames = await gameRepository.getLiveGames();
        return liveGames || [];
    } catch(error) {
        console.error('Error getting live games: ', error);
        throw error;
    }
}

/**
 * Get stat leaders for both teams in a game
 * @param {number} gameId - Database game ID
 * @returns {Object} Object with homeTeamLeaders and awayTeamLeaders arrays
 */

export async function getGameStatLeaders(gameId) {
    try {
        const game = await gameRepository.getGamebyId(gameId);

        if(!game) {
            throw new Error(`Game ${gameId} not found`);
        }

        const homeTeamLeaders = await playerGameStatsRepository.getStatLeadersHomeTeam(gameId, game.home_team_id);
        const awayTeamLeaders = await playerGameStatsRepository.getAwayTeamStatLeadersByGame(gameId, game.away_team_id);
        return {
            gameId: gameId,
            homeTeamLeaders: homeTeamLeaders || [],
            awayTeamLeaders: awayTeamLeaders || []
        };
    } catch(error) {
        console.error('Error getting game stat leaders: ', error);
        throw error;
    }
}

/**
 * Get game statistics aggregated by team
 * @param {number} gameId - Database game ID
 * @returns {Object} Object with homeTeamStats and awayTeamStats
 */

export async function getGameTeamStats(gameId) {
    try {
        const game = await gameRepository.getGamebyId(gameId);

        if(!game){
            throw new Error(`Game ${gameId} not found`);
        }

        const teamAggregations = await playerGameStatsRepository.getTeamAggregationsByGame(gameId);

        //split aggregations by team
        const homeTeamStats = teamAggregations.find((agg) => agg.team_id === game.home_team_id);
        const awayTeamStats = teamAggregations.find((agg) => agg.team_id === game.away_team_id);

        return {
            gameId: gameId,
            homeTeamStats: homeTeamStats || null,
            awayTeamStats: awayTeamStats || null,
        };
    } catch(error) {
        console.error('Error getting game team stats: ', error);
        throw error;
    }
}

/**
 * Get comprehensive game details including box score, leaders, and team stats
 * @param {number} gameId - Database game ID
 * @returns {Object} Complete game object with all details
 */

export async function getGameDetails(gameId) {
    try {
        const gameWithBoxScore = await getGameWithBoxScore(gameId);
        const statLeaders = await getGameStatLeaders(gameId);
        const teamStats = await getGameTeamStats(gameId);

        return {
            ...gameWithBoxScore,
            statLeaders,
            teamStats,
        };
    } catch(error) {
        console.error('Error getting complete game details: ', error);
        throw error;
    }
}
