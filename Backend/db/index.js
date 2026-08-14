//index.js, right now just contains db config

import pg from 'pg';

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, //number of clients in the pool
    idleTimeoutMillis: 30000, //close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, //return an error after 2 seconds if connection could not be established
});

export default pool;