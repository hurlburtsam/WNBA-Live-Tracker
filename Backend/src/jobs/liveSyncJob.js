// Backend/src/jobs/liveSyncJob.js

import { syncFullGameData } from "../services/syncService.js";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/wnba";

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.json();
}

async function syncSingleEvent(io, event) {
  const gameId = event?.id;

  if (!gameId) {
    return null;
  }

  try {
    const summaryUrl = `${ESPN_BASE}/summary?event=${gameId}`;
    const summary = await fetchJson(summaryUrl);

    const syncedGame = await syncFullGameData(event, summary);

    io.to(`game:${syncedGame.id}`).emit("game:update", {
      type: "game",
      gameId: syncedGame.id,
      data: {
        id: syncedGame.id,
        externalId: syncedGame.external_id,
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
  } catch (error) {
    console.error(`Error syncing event ${gameId}:`, error);
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

      if (game) {
        syncedGames.push(game);
      }
    }

    io.emit("games:live", {
      type: "games",
      count: syncedGames.length,
      data: syncedGames,
    });

    return syncedGames;
  } catch (error) {
    console.error("Error syncing live games:", error);
    throw error;
  }
}

export function startLiveSyncJob(io, { intervalMs = 15000 } = {}) {
  console.log("Starting live sync job...");

  syncLiveGames(io).catch((error) => {
    console.error("Initial live sync failed:", error);
  });

  const interval = setInterval(() => {
    syncLiveGames(io).catch((error) => {
      console.error("Live sync interval failed:", error);
    });
  }, intervalMs);

  return interval;
}