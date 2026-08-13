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
                plus_minus = EXCLUDED.plus_minus
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

        return result.rows[0];
}
    