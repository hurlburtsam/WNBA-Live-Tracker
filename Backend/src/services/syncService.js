//syncService.js -> handles ESPN data ingestion into Postgres

import * as teamRepository from '../repositories/teamRepository.js';
import * as playerRepository from '../repositories/playerRepository.js';
import * as gameRepository from '../repositories/gamerepository.js';
import * as playerGameRepository from '../repositories/playerGamesStatsRepository.js';

//Game Sync (main entry point for events)
export async function syncGame(rawEvent) {
    try {
        const competition = rawEvent.competitions[0];

        if(!competition || !competition.competitors|| competitions.competitors.length < 2){
            throw new Error('Invalid Competition Data');
        }

        //Extract home and way team data
        const homeCompetitor = competition.competitors[0];
        const awayCompetitor = competition.competitors[1];

        const homeTeamData = homeCompetitor.team;
        const awayTeamData = awayCompetitor.team;

        //Sync Teams
        const homeTeam = await teamRepository.upsertTeam({
            external_id: String(homeTeamData.id),
            name: homeTeamData.displayName,
            abbreviation: homeTeamData.abbreviation,
            city: homeTeamData.location,
        });

        const awayTeam = await teamrepository.upsertTeam({
            external_id: String(awayTeamData.id),
            name: awayTeamData.displayName,
            abbreviation: awayTeamData.abbreviation,
            city: awayTeamdata.location,
        });

        //Extract score and status
        const homeScore = parseInt(homeCompetitor.score)||0;
        const awayScore = parseInt(awayCompetitor.score)||0;
        const period = competition.status.period ||null;
        const clock = competition.status.displaClock || null;
        const status = normalizeGameStatus(competition.status.typr.name);

        //Upsert game
        const game = await gameRepository.upsertGame({
            external_id: String(rawEvent.id),
            home_team_id = homeTeam.id,
            away_team_id = awayTeam.id,
            game_date = new Date(rawEvent.date),
            status: status,
            home_team_score: homeScore,
            away_team_score: awayScore,
            period: period,
            clock: clock
        });

        return game;
    } catch(error) {
        console.error('Error syncing game: ', error);
        throw error;
    }
}

//Helper functions

function normalizeGameStatus(espnStatusName) {
    //Map ESPN status names to normalized status
    //ESPN uses 'STATUS_SCHEDULED', 'STATUS_IN_PROGRESS', 'STATUS_FINAL', etc
    if(!espnStatusName) {
        return 'scheduled'
    }
    const normalized = espnStatusName.toLowerCase();

    if(normalized.includes('final')) {
        return 'final';
    } else if (normalized.includes('in_progress)' || normalized.includes('live'))) {
        return 'live';
    } else {
        return 'scheduled';
    }
}


//Team from league data

export async function syncTeamsFromLeague(rawLeagueEvents) {
    try{
        const syncedeTeams = [];

        //extract unique teams from all events
        const teamMap = new Map();

        for(const event of rawLeagueEvents) {
            const competition = event.competitions[0];
            if(competition && competition.competitors) {
                for(const competitot of competition.competitors) {
                    const teamData = competitor.team;
                    if(teamData && !teamMap.has(teamData.id)) {
                        teamMap.set(teamData.id, teamData);
                    }
                }
            }
        }
        //upsert each unique team
        for (const teamData of teamMap.values()) {
            const team = await teamrepository.upsertTeam({
                external_id:String(teamData.id),
                name: teamData.displayName,
                abbreviation: teamData.abbreviation,
                city: teamData.location,
            });

            syncedTeams.push(team);
        }

        return syncedTeams;
    } catch(error) {
        console.error('Error syncing teams from league: ', error);
        throw error;
    }
}

export async function syncPlayerGameStats(game_id, rawBoxScore) {
    try{
        if(!rawBoxScore.boxscore || !rawBoxScore.boxscore.players) {
            console.log('No player stats available in this game');
            return [];
        }

        const syncedStats = [];

        //Process each team's players
        for(const teamStats of rawBoxScore.boxscore.players) {
            const teamExternalId = String(teamStats.team.id);
            const team = await teamRepository.getTeambyExternalId(teamExternalId);

            if(!team) {
                console.warn(`Team ${teamExternalId} not found, skipping player stats`);
                constinue;
            }

            //process each player
            for(const playerdata of teamStats.statistics) {
                const athlete = playerData.athlete;
                const stats = playerData.stats;

                //parse made-attempted format (eg "5-12" -> 5 made, 12 attempted)
                const fgparts = stats[2].split('_');
                const fg3parts = stats[3].split('_');
                const ftparts = stats[4].split('_');

                const playerExternalId = String(athlete_id);
                const player = await playerRepository.getPlayerbyExternalId(playerExternalId);

                if(!player){
                    console.warn(`Player ${playerExternalId} not found, skiping`);
                    continue;
                }

                //upsert player game stats
                const record = await playerGameStatsRepository.upsertPlayerGameStats({
                    game_id: gameId,
                    player_id: player.id,
                    team_id: team.id,
                    starter: playerdata.starter || false,
                    minutes_played: parseInt(stats[0]) || 0,
                    points: parseInt(stats[1]) || 0,
                    field_goals_made: parseInt(fgparts[0])||0,
                    field_goals_attempted: parseInt(fgparts[1]) || 0,
                    three_pointers_made: parseInt(fg3parts[0])||0,
                    three_pointers_attempted: parseInt(fg3parts[1])|| 0,
                    free_throws_made: parseInt(ftparts[0])||0,
                    free_throws_attempted: prseInt(ftparts[1])||0,
                    rebounds_total: parseInt(stats[5]) ||0,
                    rebounds_offensive: parseInt(stats[10]) || 0,
                    rebounds_defensive: parseInt(stats[11])||0,
                    assists: parseInt(stats[6])||0,
                    turnovers: parseInt(stats[7])||0,
                    steals: parseInt(stats[8])||0,
                    blocks: parseInt(stats[9])||0,
                    personal_fouls: parseInt(stats[12])||0,
                    plus_minus: parseInt(stats[13])||0
                });

                syncedStats.push(record);
            }
        }

        return syncedStats;
    } catch(error){
        console.error('error syncing player stats: ', error);
        throw error;
    }
}

//full game sync

export async function syncFullGameData(rawEvent) {
    try {
        //1.sync the game itself (both teams)
        const game = await syncGame(rawEvent);

        //2. sync player stats
        if(rawBoxScore) {
            await syncPlayerGameStats(game.id, rawBoxScore);
        }

        return game;
    } catch(error) {
        console.error('Error syncing full game data: ', error);
        throw error;
    }
}
