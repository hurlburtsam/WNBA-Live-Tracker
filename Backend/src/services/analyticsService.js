import * as analyticsRepository from '../repositories/analyticsRepository.js';

// Get career stats for a player

export async function getPlayerCareerStats(player_id) {
    try {
        const stats = await analyticsRepository.getPlayerCareerStats(player_id);
        return stats || [];
    } catch(error) {
        console.error('Error in getPlayerCareerStats service: ', error);
        throw error;
    }
}

// Get a specifc player career high for a stat type

export async function getCareerHighByStat(player_id, stat_type) {
    try {
        return await analyticsRepository.getCareerHighByStat(player_id, stat_type);
    } catch(error) {
        console.error('Error in getCareerHighByStat service: ', error);
        throw error;
    }
}

// Get players on pace for a career high

export async function getPlayersOnPaceForCareerHigh(game_id) {
    try {
        const players = await analyticsRepository.getPlayersOnPaceForCareerHigh(game_id);
        return players || [];
    } catch(error) {
        console.error('Error getPlayersOnPaceForCareerHigh service: ', error);
        throw error;
    }
}

// Update career stats for player after game

export async function updatePlayerCareerStatsAfterGame(player_id, game_id) {
    try {
        return await analyticsRepository.updatePlayerCareerStatsAfterGame(player_id, game_id);
    } catch(error) {
        throw new Error('Error in updating career stats after game: ', error);
        throw error;
    }
}

//Update career stats for all players in a game

export async function updateAllPlayerCareerStatsForGame(gameId) {
  try {
    return await analyticsRepository.updateAllPlayerCareerStatsForGame(gameId);
  } catch (error) {
    console.error('Error in updateAllPlayerCareerStatsForGame service:', error);
    throw error;
  }
}

// Get top players for a stat type

export async function getTopPlayersForStat(statType, limit = 10) {
  try {
    return await analyticsRepository.getTopPlayersForStat(statType, limit);
  } catch (error) {
    console.error('Error in getTopPlayersForStat service:', error);
    throw error;
  }
}

// Get player's season average for a stat

export async function getPlayerSeasonAverage(playerId, statType) {
  try {
    return await analyticsRepository.getPlayerSeasonAverage(playerId, statType);
  } catch (error) {
    console.error('Error in getPlayerSeasonAverage service:', error);
    throw error;
  }
}

// Build a response object for a player's career analytics summary

export async function getPlayerCareerAnalytics(player_id, stat_types = ['points', 'rebounds', 'assists']) {
    try {
        const results = await Promise.all(
            stat_types.map(async (stat_type)=> {
                const stat = await analyticsRepository.getPlayerSeasonAverage(player_id, stat_type);
                return {
                    stat_type,
                    avg_value: stat?.avg_value ?? null,
                    games_played: stat?.games_played ?? 0,
                };
            })
        );

        return {
            player_id: player_id,
            season_averages: results,
        };
    } catch(error) {
        console.error('Error getting season averages: ', error);
        throw error;
    }
}