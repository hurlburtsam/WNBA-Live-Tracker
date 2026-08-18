--teams
CREATE TABLE teams(
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    city TEXT
);

--players
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    position TEXT,
        jersey_number INTEGER
);

--games
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    external_id TEXT UNIQUE NOT NULL,
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    game_date TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    period INTEGER,
    clock TEXT
);

--player game stats (box score)
CREATE TABLE player_game_stats (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id),
    player_id INTEGER NOT NULL REFERENCES players(id),
    team_id INTEGER NOT NULL REFERENCES teams(id),
    starter BOOLEAN DEFAULT false,
    minutes_played INTEGER,
    points INTEGER DEFAULT 0,
    rebounds_offensive INTEGER DEFAULT 0,
    rebounds_defensive INTEGER DEFAULT 0,
        rebounds_total INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    personal_fouls INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    three_pointers_made INTEGER DEFAULT 0,
    three_pointers_attempted INTEGER DEFAULT 0,
    free_throws_made INTEGER DEFAULT 0,
    free_throws_attempted INTEGER DEFAULT 0,
    plus_minus INTEGER,
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE (game_id, player_id)
);

--player career stats
CREATE TABLE player_career_stats (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id),
    stat_type TEXT NOT NULL,
    career_high INTEGER NOT NULL,
    season_avg NUMERIC(5,2),
    last_updated TIMESTAMP DEFAULT now(),
    UNIQUE (player_id, stat_type)
);