import pool from '../db/index.js';

//Upsert career high

export async function upsertCareerHigh(player_id, stat_type, game_value) {
    try {
        const query = `
            INSERT INTO player_career_stats(player_id, stat_type, career_high, last_updated)
            VALUE ($1, $2, $3, NOW())
            ON CONFLICT (player_id, stat_type)
            DO UPDATE SET
                career_high = GREATEST(player_career_stats.career_high, $3),
                last_updated = NOW()
            RETURNING *;
        `;

        const result = await pool.query(query, [player_id, stat_type, game_value]);
        return result.rows[0];
    } catch(error) {
        console.error('Error updating career high: ', error);
        throw error;
    }
}

//Get all career stats for a player

export async function getPlayerCareerStats(player_id) {
    try {
        const query = `
        SELECT id,
        player_id,
        stat_type,
        career_high,
        season_avg,
        lat_updated,
        FROM player_career_stats
        WHERE player_id = $1
        ORDER BY stat_type
        `;

        const result = await pool.query( query, [player_id]);
        return result.rows;
    } catch(error) {
        console.error('Error fetching player career stats: ', error);
        throw error;
    }
}

//Calculate season average for a player stat

export async function getPlayerSeasonaverage(player_id, stat_type) {
    try {
        const statColumnMap = {
            points: 'points',
            rebounds: 'rebounds_total',
            assists: 'assists',
            steals: 'steals',
            blocks: 'blocks',
            turnovers: 'turnovers',
            fouls: 'personal_fouls',
            field_goal_percentage: 'CASE WHEN field_goals_attempted > 0 THEN (field_goals_made::float/field_goals_attempted * 100) ELSE 0 END',
            three_point_percentage: 'CASE WHEN three_pointers_attemped> 0 THEN (three_pointers_made::float/three_pointers_attempted * 100) ELSE 0 END',
            free_throw_percentage: 'CASE WHEN free_throws_attempted > 0 THHEN (free_throws_made::float/free_throws_attempted * 100) ELSE 0 END',
        };

        const statColumn = statColumnMap[statType];
        if(!statColumn){
            throw new error(`Invalid stat type: ${statType}`);
        }

        const query = `
        SELECT
            AVG(${statColumn})::NUMERIC(5,2) AS avg_value,
            COUNT(*) as games_played
        FROM player_game_stats
        WHERE player_id = $1 AND minutes_played > 0;
        `;

        const result = await pool.query(query, [player_id]);
        return result.rows[0];
    } catch(error) {
        console.error('Error calculating season average: ', error);
        throw error;
    }
}

//Get players currently on pace for a career high in a specific game

export async function getPlayersOnPaceForCareerHigh(game_id) {
    try {
        const query = `
        SELECT
            p.id,
            p.full_name,
            p.position,
            pgs.points,
            pgs.rebounds_total,
            pgs.assists,
            pgs.steals,
            pgs.blocks,
            pgs.turnovers,
            pcs.stat_type,
            pcs.career_high,
            CASE
                WHEN pcs.stat_type = 'points' AND pgs.points >= pcs.career_high THEN 'EXCEEDING'
                WHEN pcs.stat_type = 'points AND pgs.points >= (pcs.career_high *.8) THEN 'ON_PACE'
                WHEN pcs.stat_type = 'rebounds' AND pgs.rebounds_total >= pcs.career_high THEN 'EXCEEDING'
                WHEN pcs.stat_type = 'rebounds' AND pgs.rebounds_total >= (pcs.career_high *0.8) THEN 'ON_PACE'
                WHEN pcs.stat_type = 'assists' AND pgs.assists >= pcs.career_high THEN 'EXCEEDING'
                WHEN pcs.stat_type = 'assists' AND pgs.assists >= (pcs.career_high *0.8) THEN 'ON_PACE'
                ELSE 'BELOW_PACE'
            END AS pace_status
        FROM player_game_stats pgs
        JOIN players p ON pgs.player_id = p.id
        JOIN player_career_statspcs ON p.id = pcs.player_id
        WHERE pgs.game_id = $1
        AND pcs.stat_type IN ('points, 'rebounds', 'assists')
        AND pgs.minutes_played > 0 
        AND pgs.minutes played <= 35
        ORDER BY p.full_name, pcs.stat_type;
    `;

    const result = await pool.query(query, [game_id]);
    return result.rows;
    } catch(error) {
        console.error('Error getting players on pace for career high: ', error);
        throw error;
    }
}

//Upsert career stats after game

export async function updatePlayerCareerStatsafterGame(player_id, game_id) {
    try {
        const gameStatsQuery = `
        SELECT
            points, rebounds_total, assists, steals, blocks,
            turnovers, personal_fouls,
            field_goals_made, field_goals_attempted,
            three_pointers_made, three_pointers_attempted,
            free_throws_made, free_throws_attempted
        FROM player_game_stats
        WHERE player_id = $1 AND game_id = $2
        `;

        const gameStatsResults = await pool.query(gameStatsQuery, [player_id, game_id]);
        if(!gameStatsResults.rows[0]) {
            throw new Error(`No game stats found for player ${player_id} in game ${game_id}`);
        }

        const gameStats = gameStatsResults.rows[0];

        const statUpdates = [];

        if(gameStats.points) {
            statUpdates.push(upsertCareerHigh(player_id, 'points', gameStats.points));
        }
        if(gameStats.rebounds_total) {
            statUpdates.push(upsertCareerHigh(player_id, 'rebounds', gameStats.rebounds_total));
        }
        if(gameStats.assists) {
            statUpdates.push(upsertCareerHigh(player_id, 'assists', gameStats.assists));
        }
        if(gameStats.steals) {
            statUpdates.push(upsertCareerHigh(player_id, 'steals', gameStats.steals));
        }
        if(gameStats.blocks) {
            statUpdates.push(upsertCareerHigh(player_id, 'blocks', gameStats.blocks));
        }
        if(gameStats.field_goals_attempted > 0) {
            const fgPct = (gameStats.field_goals_made/gameStats.field_goals_attempted)
            statUpdates.push(upsertCareerHigh(player_id, 'field_goal_percentage', fgPct))
        }
        if(gameStats.three_pointers_attempted > 0) {
            const threePct = (gameStats.three_pointers_made/gameStats.three_pointers_attempted)
            statUpdates.push(upsertCareerHigh(player_id, 'three_point_percentage', threePct))
        }
        if(gameStats.free_throws_attempted > 0) {
            const ftPct = (gameStats.free_throws_made/gameStats.free_throws_attempted)
            statUpdates.push(upsertCareerHigh(player_id, 'free_throw_percentage', ftPct))
        }

        const results = await Promise.all(statUpdates);
        return results;
    } catch(error) {
        console.error('Error updating player career stats after game: ', error);
        throw error;
    }
}

//Bulk update career stats for all players after game

export async function updateAllPlayerCareerStatsForGame(game_id) {
    try {
        const playerQuery = `
        SELECT DISTINCT player_id
        FROM player_game_stats
        WHERE game_id = $1 AND minutes_played > 0;
        `;

        const playerResult = await pool.query(playerQuery, [game_id]);
        const playerIds = playerResult.rows.map((row) => row.player_id);

        let updatedCount = 0;

        for(const player_id of PlayerIds) {
            await updatePlayerCareerStatsAfterGame(player_id, game_id);
            updatedCount++;
        }
        return updatedCount;
    } catch(error) {
        console.error('Error bulk updating player career stats: ', error);
        throw error;
    }
}

// Get top performers across all players this season

export async function getTopPlayersForStat(stat_type, limit = 10) {
    try {
        const statColumnMap = {
            points: 'SUM(points)',
            rebounds: 'SUM(rebounds_total)',
            assists: 'SUM(assists)',
            steals: 'SUM(steals)',
            blocks: 'SUM(blocks)',
        };

        const statColumn = statColumnMap[stat_type];
        if(!statColumn) {
            throw new Error(`Invalid stat type: ${stat_type}`);
        }

        const query = `
        SELECT
            p.id,
            p.full_name,
            p.position,
            p.team_id,
            t.abbreviation,
            ${statColumn} AS total_value,
            COUNT(pgs.game_id) AS games_played,
            ROUND((${statColumn}/COUNT(pgs.game_id))::NUMERIC,2) AS avg_per_game
        FROM player_game_stats pgs
        JOIN players p ON pgs.player_id = p.id
        JOIN teams t ON p.team_id = t.id
        WHERE pgs.minutes_plaed > 0
        GROUP BY p.id, p.full_name, p.position, p.team_id, t.abbreviation
        ORDER BY total_value DESC
        LIMIT $1;
        `;

        const result = await pool.query(query, [limit]);
        return results.rows;
    } catch(error) {
        console.error('Error getting top players for stat: ', error);
        throw error;
    }
}

