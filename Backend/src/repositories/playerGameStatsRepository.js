// player game stats repositry -> for indiv. player game stats

import pool from '../db/index.js';

export async function upsertPlayerGameStats({
    game_id,
    player_id,
    team_id,
    starter,
    minutes_played,
    points,
    rebounds_offensive,
    rebounds_defensive,
    rebounds_total,
    assists,
    steals,
    blocks,
    turnovers,
    personal_fouls,
    field_goals_made,
    field_goals_attempted,
    three_pointers_made,
    three_pointers_attempted,
    free_throws_made,
    free_throws_attempted,
    plus_minus,
}) {
    const result = await pool.query(
        `
            INSERT INTO player_game_stats (
                game_id,
                player_id,
                team_id,
                starter,
                minutes_played,
                points,
                rebounds_offensive,
                rebounds_defensive,
                rebounds_total,
                assists,
                steals,
                blocks,
                turnovers,
                personal_fouls,
                field_goals_made,
                field_goals_attempted,
                three_pointers_made,
                three_pointers_attempted,
                free_throws_made,
                free_throws_attempted,
                plus_minus
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            )
            ON CONFLICT (game_id, player_id)
            DO UPDATE SET
                team_id = EXCLUDED.team_id,
                starter = EXCLUDED.starter,
                minutes_played = EXCLUDED.minutes_played,
                points = EXCLUDED.points,
                rebounds_offensive = EXCLUDED.rebounds_offensive,
                rebounds_defensive = EXCLUDED.rebounds_defensive,
                rebounds_total = EXCLUDED.rebounds_total,
                assists = EXCLUDED.assists,
                steals = EXCLUDED.steals,
                blocks = EXCLUDED.blocks,
                turnovers = EXCLUDED.turnovers,
                personal_fouls = EXCLUDED.personal_fouls,
                field_goals_made = EXCLUDED.field_goals_made,
                field_goals_attempted = EXCLUDED.field_goals_attempted,
                three_pointers_made = EXCLUDED.three_pointers_made,
                three_pointers_attempted = EXCLUDED.three_pointers_attempted,
                free_throws_made = EXCLUDED.free_throws_made,
                free_throws_attempted = EXCLUDED.free_throws_attempted,
                plus_minus = EXCLUDED.plus_minus,
                updated_at = NOW()
            RETURNING *
            `,
            [
                game_id,
                player_id,
                team_id,
                starter,
                minutes_played,
                points,
                rebounds_offensive,
                rebounds_defensive,
                rebounds_total,
                assists,
                steals,
                blocks,
                turnovers,
                personal_fouls,
                field_goals_made,
                field_goals_attempted,
                three_pointers_made,
                three_pointers_attempted,
                free_throws_made,
                free_throws_attempted,
                plus_minus,
            ]
        );

        return result.rows;
}

export async function getBoxScorebyGameId(game_id) {
    const result = await pool.query(
        `
        SELECT *
        FROM player_game_stats
        WHERE game_id = $1
        `,
        [game_id]
    )

    return result.rows;
}

export async function getPlayerGameStatsByPlayerId(player_id) {
    const result = await pool.query(
        `
        SELECT *
        FROM player_game_stats
        WHERE player_id = $1
        `,
        [player_id]
    )

    return result.rows;
}

export async function getTeamAggregationsByGame(game_id) {
    const result = await pool.query(
        `
        SELECT
            t.id AS team_id,
            t.name AS team_name,
            SUM(pgs.points) AS total_points,
            SUM(pgs.rebounds_total) AS total_rebounds,
            SUM(pgs.assists) AS total_assists,
            SUM(pgs.steals) AS total_steals,
            SUM(pgs.blocks) AS total_blocks,
            SUM(pgs.turnovers) AS total_turnovers
        FROM player_game_stats pgs
        JOIN teams t ON t.id = pgs.team_id
        WHERE pgs.game_id = $1
        GROUP BY t.id, t.name
        ORDER BY t.id
        `,
        [game_id]
    );

    return result.rows;
}

export async function getStatLeadersHomeTeam(game_id, home_team_id){
    const result = await pool.query(
        `
        WITH player_totals AS (
            SELECT
                p.id AS player_id,
                p.full_name,
                SUM(pgs.points) AS points,
                SUM(pgs.rebounds_total) AS rebounds,
                SUM(pgs.assists) AS assists
            FROM player_game_stats pgs
            JOIN players p
                ON p.id = pgs.player_id
            WHERE pgs.game_id = $1
                AND pgs.team_id = $2
            GROUP BY p.id, p.full_name
            )
        SELECT
            'points' AS stat_name,
            player_id,
            full_name,
            points AS stat_value
        FROM (
            SELECT
                player_id,
                full_name,
                points,
                ROW_NUMBER() OVER (ORDER BY points DESC) AS rn
            FROM player_totals
        ) ranked
         WHERE rn = 1
         
         UNION ALL
         
         SELECT
            'rebounds' AS stat_name,
            player_id,
            full_name,
            rebounds AS stat_value
        FROM (
            SELECT
                player_id,
                full_name,
                rebounds,
                ROW_NUMBER() OVER (ORDER BY rebounds DESC) AS rn
            FROM player_totals
        ) ranked
         WHERE rn = 1
         
         UNION ALL
         
         SELECT
            'assists' AS stat_name,
            player_id,
            full_name,
            assists AS stat_value
        FROM (
            SELECT
                player_id,
                full_name,
                assists,
                ROW_NUMBER() OVER (ORDER BY assists DESC) AS rn
            FROM player_totals
        ) ranked
         WHERE rn = 1
         ORDER BY stat_name
         `,
         [game_id,home_team_id]
    );

    return result.rows;
}

export async function getAwayTeamStatLeadersByGame(game_id, away_team_id) {
    const result = await pool.query(
        `
        WITH player_totals AS (
            SELECT
                p.id AS player_id,
                p.full_name,
                SUM(pgs.points) AS points,
                SUM(pgs.rebounds_total) AS rebounds,
                SUM(pgs.assists) AS assists
            FROM player_game_stats pgs
            JOIN players p
              ON p.id = pgs.player_id
            WHERE pgs.game_id = $1
              AND pgs.team_id = $2
            GROUP BY p.id, p.full_name
        )
        SELECT
            'points' AS stat_name,
            player_id,
            full_name,
            points AS stat_value
        FROM (
            SELECT
                player_id,
                full_name,
                points,
                ROW_NUMBER() OVER (ORDER BY points DESC) AS rn
            FROM player_totals
        ) ranked
        WHERE rn = 1

        UNION ALL

        SELECT
            'rebounds' AS stat_name,
            player_id,
            full_name,
            rebounds AS stat_value
        FROM (
            SELECT
                player_id,
                full_name,
                rebounds,
                ROW_NUMBER() OVER (ORDER BY rebounds DESC) AS rn
            FROM player_totals
        ) ranked
        WHERE rn = 1

        UNION ALL

        SELECT
            'assists' AS stat_name,
            player_id,
            full_name,
            assists AS stat_value
        FROM (
            SELECT
                player_id,
                full_name,
                assists,
                ROW_NUMBER() OVER (ORDER BY assists DESC) AS rn
            FROM player_totals
        ) ranked
        WHERE rn = 1
        ORDER BY stat_name
        `,
        [game_id, away_team_id]
    );

    return result.rows;
}

    