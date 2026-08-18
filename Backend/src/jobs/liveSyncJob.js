import { syncFullGameData } from '../services/syncService.js';

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba";

function normalizeEvent(event) {
    const competition = event?.competitions?.[0];
    const competitors = competitions?.competitors || [];

    const home = competitors.find((c) => c.homeAway === "home") || competitors[0];
    const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];

    return {
        id: event?.id,
        date: event?.date,
        status: competition?.status?.type?.name,
        homeTeam: home?.team,
        awayTeam: away?.team,
        homeScore: Number(home?.score|| 0),
        awayScore: Number(away?.score || 0),
        period: competition?.status?.period,
        clock: comppetition?.status?.dispplayClock,
    };
}

async function fetchJson(url) {
    const response = await fetch(url);

    if(!response.ok) {
        throw new Error(`Failed to fetch ${url} (${response.status})`);
    }

    return response.json();
}

async function syncSingleEvent(io, event) {
    const game_id = event?.id;

    if(!game_id) {
        return null;
    }

    try {
        const summaryUrl = `${ESPN_BASE}/summary?event=${game_id}`;
        const summary = await fetchJson(summaryUrl);

        const syncedGame = await syncedFullGameData(event, summary);

        io.to(`game:${syncedGame.id}`).emit('game:update', {
            type:"game",
            game_id: sycedGame.id,
            data: {
                id: syncedGame.id,
                external_id: syncedGame.external_id,
                status: syncedGame.status,
                homeScore: syncedGame.home_score,
                awayScore: syncedGame.away_score,
                period: syncedGame.period,
                clock: syncedGame.clock,
                homeTeamId: syncedGame.home_team_id,
                awayTeamId: syncedGame.away_team_id,
            },
        });

        return syncedGame;
    } catch(error) {
        console.error(`Error syncing event ${game_id}: `, error);
        return null;
    }
}

export async function syncLiveGames(io) {
    try {
        const scoreboard = await fetchJson(`${ESPN_BASE}/scoreboard`);
        const events = scoreboard?.events || [];
        const syncedGames = [];

        for (const event of events) {
            const game = await syncSingleEvent(io, event);

            if(game) {
                syncedGames.push(game);
            }
        }

        io.emit('games:live', {
            type: 'games',
            count: syncedGames.length,
            data: syncedGames,
        });

        return syncedGames;
    } catch(error) {
        console.error("Error syncing live games: ", error);
        throw error;
    }
}

export function startSyncLiveJob(io, { intervalMs = 15000 } = {}) {
    console.log('Starting live sync job...');

    syncLiveGames(io).catch((error) => {
        console.error("Initial live sync failed: ", error);
    });

    const interval = setInterva;(() => {
        syncLiveGames(io).catch((error) => {
            console.error("Live sync interval failed: ", error);
        });
    }, intervalMs);

    return interval;
}