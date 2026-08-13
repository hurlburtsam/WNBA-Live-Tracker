//team repository -> SQL queries for team data

import pool from '../db/index.js';

export async function upsertTeam({external_id, name, abbreviation, city}){
    const result = await pool.query(
        `
        INSERT INTO teams (external_id, name, abbreviation, city)
        VALUES ($1, $,2, $3, $4)
        ON CONFLICT (external_id)
        DO UPDATE SET
            name = EXCLUDED.name,
            abbreviation = EXCLUDED.abbreviation,
            city = EXCLUDED.city
        RETURNING *
        `,
       [external_id, name, abbreviation, city] 
    );

    return result.rows[0];
}

export async function getTeambyExternalId(external_id){
    const result = await pool.query(
        `
        SELECT *
        FROM teams
        WHERE external_id = $1
        `,
        [external_id]
    );

    return result.rows[0];
}