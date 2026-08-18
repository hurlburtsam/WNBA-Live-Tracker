// Backend/src/services/syncService.js

import * as teamRepository from "../repositories/teamRepository.js";
import * as playerRepository from "../repositories/playerRepository.js";
import * as gameRepository from "../repositories/gameRepository.js";
import * as playerGameStatsRepository from "../repositories/playerGameStatsRepository.js";
import * as analyticsRepository from "../repositories/analyticsRepository.js";

/**
 * Normalize ESPN status strings into app status values
 * @param {string} espnStatusName
 * @returns {"scheduled" | "live" | "final"}
 */
export function normalizeGameStatus(espnStatusName) {
  if (!espnStatusName) return "scheduled";

  const normalized = espnStatusName.toLowerCase();

  if (normalized.includes("final")) return "final";
  if (normalized.includes("in_progress") || normalized.includes("live")) return "live";

  return "scheduled";
}

/**
 * Sync a single ESPN event into teams + game
 * @param {object} rawEvent
 * @returns {object} database game row
 */
export async function syncGame(rawEvent) {
  try {
    const competition = rawEvent?.competitions?.[0];

    if (!competition || !competition.competitors || competition.competitors.length < 2) {
      throw new Error("Invalid competition data");
    }

    const homeCompetitor = competition.competitors[0];
    const awayCompetitor = competition.competitors[1];

    const homeTeamData = homeCompetitor.team;
    const awayTeamData = awayCompetitor.team;

    const homeTeam = await teamRepository.upsertTeam({
      external_id: String(homeTeamData.id),
      name: homeTeamData.displayName,
      abbreviation: homeTeamData.abbreviation,
      city: homeTeamData.location,
    });

    const awayTeam = await teamRepository.upsertTeam({
      external_id: String(awayTeamData.id),
      name: awayTeamData.displayName,
      abbreviation: awayTeamData.abbreviation,
      city: awayTeamData.location,
    });

    const homeScore = Number(homeCompetitor.score) || 0;
    const awayScore = Number(awayCompetitor.score) || 0;
    const period = competition.status?.period || null;
    const clock = competition.status?.displayClock || null;
    const status = normalizeGameStatus(competition.status?.type?.name);

    const game = await gameRepository.upsertGame({
      external_id: String(rawEvent.id),
      home_team_id: homeTeam.id,
      away_team_id: awayTeam.id,
      game_date: new Date(rawEvent.date),
      status,
      home_team_score: homeScore,
      away_team_score: awayScore,
      period,
      clock,
    });

    return game;
  } catch (error) {
    console.error("Error syncing game:", error);
    throw error;
  }
}

/**
 * Sync all teams from a league scoreboard payload
 * @param {Array} rawLeagueEvents
 * @returns {Array} synced teams
 */
export async function syncTeamsFromLeague(rawLeagueEvents) {
  try {
    const syncedTeams = [];
    const teamMap = new Map();

    for (const event of rawLeagueEvents) {
      const competition = event?.competitions?.[0];

      if (!competition || !competition.competitors) continue;

      for (const competitor of competition.competitors) {
        const teamData = competitor.team;

        if (teamData && !teamMap.has(teamData.id)) {
          teamMap.set(teamData.id, teamData);
        }
      }
    }

    for (const teamData of teamMap.values()) {
      const team = await teamRepository.upsertTeam({
        external_id: String(teamData.id),
        name: teamData.displayName,
        abbreviation: teamData.abbreviation,
        city: teamData.location,
      });

      syncedTeams.push(team);
    }

    return syncedTeams;
  } catch (error) {
    console.error("Error syncing teams from league:", error);
    throw error;
  }
}

/**
 * Sync all player game stats from an ESPN summary boxscore payload
 * @param {number} gameId
 * @param {object} rawBoxScore
 * @returns {Array} synced stat rows
 */
export async function syncPlayerGameStats(gameId, rawBoxScore) {
  try {
    if (!rawBoxScore?.boxscore?.players) {
      console.log("No player stats available in this game");
      return [];
    }

    const syncedStats = [];

    for (const teamStats of rawBoxScore.boxscore.players) {
      const teamExternalId = String(teamStats.team.id);
      const team = await teamRepository.getTeamByExternalId(teamExternalId);

      if (!team) {
        console.warn(`Team ${teamExternalId} not found, skipping player stats`);
        continue;
      }

      for (const playerData of teamStats.statistics) {
        const athlete = playerData.athlete;
        const stats = playerData.stats || [];

        const fgParts = String(stats[2] || "0-0").split("-");
        const fg3Parts = String(stats[3] || "0-0").split("-");
        const ftParts = String(stats[4] || "0-0").split("-");

        const playerExternalId = String(athlete.id);
        const player = await playerRepository.upsertPlayer({
          external_id: playerExternalId,
          full_name: athlete.displayName || athlete.fullName || "Unknown Player",
          team_id: team.id,
          position: athlete.position?.abbreviation || athlete.position?.name || null,
          jersey_number: athlete.jersey ? Number(athlete.jersey) : null,
        });

        const record = await playerGameStatsRepository.upsertPlayerGameStats({
          game_id: gameId,
          player_id: player.id,
          team_id: team.id,
          starter: Boolean(playerData.starter),
          minutes_played: Number(stats[0]) || 0,
          points: Number(stats[1]) || 0,
          field_goals_made: Number(fgParts[0]) || 0,
          field_goals_attempted: Number(fgParts[1]) || 0,
          three_pointers_made: Number(fg3Parts[0]) || 0,
          three_pointers_attempted: Number(fg3Parts[1]) || 0,
          free_throws_made: Number(ftParts[0]) || 0,
          free_throws_attempted: Number(ftParts[1]) || 0,
          rebounds_total: Number(stats[5]) || 0,
          rebounds_offensive: Number(stats[10]) || 0,
          rebounds_defensive: Number(stats[11]) || 0,
          assists: Number(stats[6]) || 0,
          turnovers: Number(stats[7]) || 0,
          steals: Number(stats[8]) || 0,
          blocks: Number(stats[9]) || 0,
          personal_fouls: Number(stats[12]) || 0,
          plus_minus: Number(stats[13]) || 0,
        });

        syncedStats.push(record);
      }
    }

    return syncedStats;
  } catch (error) {
    console.error("Error syncing player stats:", error);
    throw error;
  }
}

/**
 * Full game sync: sync teams + game + boxscore stats
 * @param {object} rawEvent
 * @param {object|null} rawBoxScore
 * @returns {object} synced game
 */
export async function syncFullGameData(rawEvent, rawBoxScore = null) {
  try {
    const game = await syncGame(rawEvent);

    if (rawBoxScore) {
      const syncedStats = await syncPlayerGameStats(game.id, rawBoxScore);
      if (syncedStats.length > 0) {
        await analyticsRepository.updateAllPlayerCareerStatsForGame(game.id);
      }
    }

    return game;
  } catch (error) {
    console.error("Error syncing full game data:", error);
    throw error;
  }
}