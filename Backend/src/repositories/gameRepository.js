//game repository -> game stats

import pooll from '../db/index.js';

export async function upsertGame({
    external_id,
    home_team_id,
    away_team_id,
    game_date,
    status,
    home_team_score,
    away_team_score,
    period,
    clock,
}) {
    const result = await pool.query(
        `
            INSERT INTO games (
            external_id,
            home_team_id,
            away_team_id,
            game_date,
            status,
            home_team_score,
            away_team_score,
            period,
            clock
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (external_id)
        DO UPDATE SET
            home_team_id = EXCLUDED.home_team_id,
            away_team_id = EXCLUDED.away_team_id,
            game_date = EXCLUDED.game_date,
            status = EXCLUDED.status,
            home_team_score = EXCLUDED.home_team_score,
            away_team_score = EXCLUDED.away_team_score,
            period = EXCLUDED.period,
            clock = EXCLUDED.clock
        RETURNING *
        `,
        [external_id, home_team_id, away_team_id, game_date, home_team_score, away_team_score, period, clock]
    );

    return result.rows[0];
}