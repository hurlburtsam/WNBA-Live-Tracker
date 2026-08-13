// player repositry -> for player stats

import pool from '../db/index/js';

export async function upsertPlayer({
    external_id,
    full_name,
    team_id,
    position,
    jersey_number,
}) {
    const result = await pool.query(
        `
        INSERT INTO players (external_id, full_name, team_id, position, jersey_number)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (external_id)
        DO UPDATE SET
            full_name = EXCLUDED.full_name,
            team_id = EXCLUDED.team_id,
            position = EXCLUDED.position,
            jersey_number = EXCLUDED.jersey_number
        RETURNING *
        `,
        [external_id, full_name, team_id, position, jersey_number]
        );
    
    return result.rows[0];
}