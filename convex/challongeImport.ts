import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Challonge API response types
type ChallongeTournament = {
  tournament: {
    id: number;
    name: string;
    url: string;
    started_at: string | null;
    completed_at: string | null;
    updated_at: string;
  };
};

type ChallongeParticipant = {
  participant: {
    id: number;
    tournament_id: number;
    name: string | null;
    username: string | null;
    display_name: string | null;
  };
};

type ChallongeMatch = {
  match: {
    id: number;
    tournament_id: number;
    state: "complete" | "open" | "pending";
    player1_id: number | null;
    player2_id: number | null;
    winner_id: number | null;
    loser_id: number | null;
    started_at: string | null;
    completed_at: string | null;
    round: number;
  };
};

type PlayerMapping = {
  challongeId: number;
  challongeUsername: string;
  userId: Id<"users"> | null;
  created: boolean;
};

type ImportResult = {
  success: boolean;
  error?: string;
  preview?: {
    tournamentName: string;
    completedMatches: number;
    participants: {
      challongeUsername: string;
      existing: boolean;
      userId: Id<"users"> | null;
    }[];
    winnerId: Id<"users"> | null;
    winnerName: string | null;
    tournamentDate: number | null;
  };
  tournamentId?: Id<"tournaments">;
  stats?: {
    matchesImported: number;
    playersCreated: number;
    playersMatched: number;
  };
};

// Helper function to fetch from Challonge API
async function fetchChallongeAPI(
  endpoint: string,
  username: string,
  apiKey: string
): Promise<any> {
  const auth = btoa(`${username}:${apiKey}`);
  const url = `https://api.challonge.com/v1${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Tournament not found");
      }
      if (response.status === 401) {
        throw new Error("Invalid Challonge credentials");
      }
      if (response.status === 429) {
        throw new Error("Rate limit exceeded - please try again later");
      }
      throw new Error(`Challonge API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to connect to Challonge API");
  }
}

// Extract username from participant
function extractUsername(participant: ChallongeParticipant): string | null {
  const p = participant.participant;
  return p.username || p.display_name || p.name;
}

// Main action to fetch and preview tournament data
export const previewChallongeTournament = action({
  args: {
    tournamentId: v.string(),
  },
  handler: async (ctx, args): Promise<ImportResult> => {
    // 1. Auth check
    const currentUser = await ctx.runQuery(api.myFunctions.getCurrentUser);
    if (!currentUser) {
      return { success: false, error: "Must be authenticated" };
    }
    if (!("role" in currentUser) || currentUser.role !== "judge") {
      return { success: false, error: "Only judges can import tournaments" };
    }

    // 2. Get credentials from environment
    const username = process.env.CHALLONGE_USERNAME;
    const apiKey = process.env.CHALLONGE_API_KEY;
    if (!username || !apiKey) {
      return {
        success: false,
        error: "Challonge credentials not configured. Please set CHALLONGE_USERNAME and CHALLONGE_API_KEY environment variables.",
      };
    }

    try {
      // 3. Fetch tournament data
      const tournamentData: ChallongeTournament = await fetchChallongeAPI(
        `/tournaments/${args.tournamentId}.json`,
        username,
        apiKey
      );

      // 4. Fetch participants
      const participantsData: ChallongeParticipant[] = await fetchChallongeAPI(
        `/tournaments/${args.tournamentId}/participants.json`,
        username,
        apiKey
      );

      if (participantsData.length === 0) {
        return { success: false, error: "Tournament has no participants" };
      }

      // 5. Fetch matches
      const matchesData: ChallongeMatch[] = await fetchChallongeAPI(
        `/tournaments/${args.tournamentId}/matches.json`,
        username,
        apiKey
      );

      const completedMatches = matchesData.filter((m) => m.match.state === "complete");
      if (completedMatches.length === 0) {
        return { success: false, error: "Tournament has no completed matches to import" };
      }

      // 6. Map participants to users
      const allPlayers = await ctx.runQuery(api.myFunctions.listPlayers);
      const participantMappings: PlayerMapping[] = [];

      for (const participant of participantsData) {
        const username = extractUsername(participant);
        if (!username) {
          participantMappings.push({
            challongeId: participant.participant.id,
            challongeUsername: "Unknown",
            userId: null,
            created: false,
          });
          continue;
        }

        // Case-insensitive match
        const normalized = username.toLowerCase().trim();
        const match = allPlayers.find((u: any) => u.name.toLowerCase().trim() === normalized);

        participantMappings.push({
          challongeId: participant.participant.id,
          challongeUsername: username,
          userId: match?._id || null,
          created: !match,
        });
      }

      // 7. Determine tournament winner
      // Find the match with the highest round (usually the finals)
      const finalMatch = completedMatches.reduce((highest, current) => {
        return current.match.round > highest.match.round ? current : highest;
      }, completedMatches[0]);

      const winnerChallongeId = finalMatch.match.winner_id;
      const winnerMapping = participantMappings.find((p) => p.challongeId === winnerChallongeId);

      // 8. Determine tournament date
      let tournamentDate: number | null = null;
      if (tournamentData.tournament.completed_at) {
        tournamentDate = new Date(tournamentData.tournament.completed_at).getTime();
      } else if (tournamentData.tournament.started_at) {
        tournamentDate = new Date(tournamentData.tournament.started_at).getTime();
      }

      // 9. Return preview data
      return {
        success: true,
        preview: {
          tournamentName: tournamentData.tournament.name,
          completedMatches: completedMatches.length,
          participants: participantMappings.map((p) => ({
            challongeUsername: p.challongeUsername,
            existing: !p.created,
            userId: p.userId,
          })),
          winnerId: winnerMapping?.userId || null,
          winnerName: winnerMapping?.challongeUsername || null,
          tournamentDate,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// Action to import tournament after preview
export const importTournamentFromChallonge = action({
  args: {
    tournamentId: v.string(),
    tournamentName: v.string(),
    tournamentDate: v.number(),
  },
  handler: async (ctx, args): Promise<ImportResult> => {
    // 1. Auth check
    const currentUser = await ctx.runQuery(api.myFunctions.getCurrentUser);
    if (!currentUser) {
      return { success: false, error: "Must be authenticated" };
    }
    if (!("role" in currentUser) || currentUser.role !== "judge") {
      return { success: false, error: "Only judges can import tournaments" };
    }

    // 2. Get credentials
    const username = process.env.CHALLONGE_USERNAME;
    const apiKey = process.env.CHALLONGE_API_KEY;
    if (!username || !apiKey) {
      return { success: false, error: "Challonge credentials not configured" };
    }

    try {
      // 3. Fetch data again
      const participantsData: ChallongeParticipant[] = await fetchChallongeAPI(
        `/tournaments/${args.tournamentId}/participants.json`,
        username,
        apiKey
      );

      const matchesData: ChallongeMatch[] = await fetchChallongeAPI(
        `/tournaments/${args.tournamentId}/matches.json`,
        username,
        apiKey
      );

      // 4. Map and create players
      const allPlayers = await ctx.runQuery(api.myFunctions.listPlayers);
      const playerIdMap = new Map<number, Id<"users">>();
      const newPlayersToCreate: { name: string; challongeId: number }[] = [];
      let playersCreated = 0;
      let playersMatched = 0;

      for (const participant of participantsData) {
        const username = extractUsername(participant);
        if (!username) continue;

        // Case-insensitive match
        const normalized = username.toLowerCase().trim();
        const match = allPlayers.find((u: any) => u.name.toLowerCase().trim() === normalized);

        if (match) {
          playerIdMap.set(participant.participant.id, match._id);
          playersMatched++;
        } else {
          // Mark for creation
          newPlayersToCreate.push({ name: username, challongeId: participant.participant.id });
          playersCreated++;
        }
      }

      // 5. Prepare matches data (will be processed in mutation after player creation)
      const completedMatches = matchesData.filter((m) => m.match.state === "complete");
      const matchesWithChallongeIds = completedMatches
        .filter((m) => m.match.winner_id !== null && m.match.loser_id !== null)
        .map((m) => ({
          winnerId: m.match.winner_id!,
          loserId: m.match.loser_id!,
          completedAt: m.match.completed_at,
        }));

      // 6. Determine tournament winner from final match
      const finalMatch = completedMatches.reduce((highest, current) => {
        return current.match.round > highest.match.round ? current : highest;
      }, completedMatches[0]);
      const tournamentWinnerChallongeId = finalMatch.match.winner_id;

      if (!tournamentWinnerChallongeId) {
        return { success: false, error: "Could not determine tournament winner" };
      }

      // 7. Call internal mutation to save everything (including player creation)
      const result = await ctx.runMutation(internal.challongeImport.importTournamentData, {
        tournament: {
          name: args.tournamentName,
          date: args.tournamentDate,
          winnerChallongeId: tournamentWinnerChallongeId,
        },
        newPlayers: newPlayersToCreate,
        existingPlayerMap: Array.from(playerIdMap.entries()).map(([challongeId, userId]) => ({
          challongeId,
          userId,
        })),
        matches: matchesWithChallongeIds.map((m) => ({
          winnerChallongeId: m.winnerId,
          loserChallongeId: m.loserId,
          completedAt: m.completedAt,
          fallbackDate: args.tournamentDate,
        })),
      });

      return {
        success: true,
        tournamentId: result.tournamentId,
        stats: {
          matchesImported: result.matchesImported,
          playersCreated,
          playersMatched,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

// Internal mutation to save all data atomically
export const importTournamentData = internalMutation({
  args: {
    tournament: v.object({
      name: v.string(),
      date: v.number(),
      winnerChallongeId: v.number(),
    }),
    newPlayers: v.array(
      v.object({
        name: v.string(),
        challongeId: v.number(),
      })
    ),
    existingPlayerMap: v.array(
      v.object({
        challongeId: v.number(),
        userId: v.id("users"),
      })
    ),
    matches: v.array(
      v.object({
        winnerChallongeId: v.number(),
        loserChallongeId: v.number(),
        completedAt: v.union(v.string(), v.null()),
        fallbackDate: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // 1. Create new players and build complete ID map
    const playerIdMap = new Map<number, Id<"users">>();

    // Add existing players to map
    for (const mapping of args.existingPlayerMap) {
      playerIdMap.set(mapping.challongeId, mapping.userId);
    }

    // Create new players
    for (const player of args.newPlayers) {
      const userId = await ctx.db.insert("users", {
        name: player.name,
        role: "player",
      });
      playerIdMap.set(player.challongeId, userId);
    }

    // 2. Resolve tournament winner
    const winnerId = playerIdMap.get(args.tournament.winnerChallongeId);
    if (!winnerId) {
      throw new Error("Could not resolve tournament winner");
    }

    // 3. Create tournament
    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.tournament.name,
      date: args.tournament.date,
      winner: winnerId,
    });

    // 4. Create all matches
    let matchesImported = 0;
    for (const match of args.matches) {
      const winnerId = playerIdMap.get(match.winnerChallongeId);
      const loserId = playerIdMap.get(match.loserChallongeId);

      if (!winnerId || !loserId) continue;

      const matchDate = match.completedAt
        ? new Date(match.completedAt).getTime()
        : match.fallbackDate;

      await ctx.db.insert("matches", {
        date: matchDate,
        tournament: tournamentId,
        winner: winnerId,
        loser: loserId,
      });
      matchesImported++;
    }

    // 5. Trigger ELO recalculation
    const seasons = await ctx.db.query("seasons").collect();
    const affectedSeason = seasons.find(
      (s) =>
        !s.deleted &&
        args.tournament.date >= s.start &&
        args.tournament.date <= s.end
    );

    if (affectedSeason) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: affectedSeason._id,
        fromTimestamp: args.tournament.date,
      });
    }

    return { tournamentId, matchesImported };
  },
});
