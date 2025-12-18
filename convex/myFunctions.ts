import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

const loadMatchesForPlayer = async (ctx: any, playerId: Id<"users">) => {
  const winnerMatches: Array<Doc<"matches">> = await ctx.db
    .query("matches")
    .withIndex("by_winner", (q: any) => q.eq("winner", playerId))
    .collect();

  const loserMatches: Array<Doc<"matches">> = await ctx.db
    .query("matches")
    .withIndex("by_loser", (q: any) => q.eq("loser", playerId))
    .collect();

  const deduped = new Map<string, Doc<"matches">>();
  for (const match of [...winnerMatches, ...loserMatches]) {
    if (match.deleted) continue;
    deduped.set(match._id, match);
  }

  return Array.from(deduped.values()).sort((a, b) => b.date - a.date);
};

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      role: v.union(v.literal("player"), v.literal("judge")),
      name: v.string(),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
});

// List all players
export const listPlayers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      role: v.union(v.literal("player"), v.literal("judge")),
      name: v.string(),
      image: v.optional(v.string()),
      hasAccount: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    const players = await ctx.db.query("users").order("desc").collect();
    const filteredPlayers = players.filter(p => !p.deleted);

    // Preload auth accounts to avoid N+1 lookups; auth tables come from authTables schema.
    const accounts = await ctx.db.query("authAccounts").collect();
    const accountByUserId = new Set(accounts.map((a) => a.userId));

    return filteredPlayers.map((p) => ({
      _id: p._id,
      _creationTime: p._creationTime,
      role: p.role,
      name: p.name,
      image: p.image,
      hasAccount: accountByUserId.has(p._id),
    }));
  },
});

// Get a user by id
export const getUserById = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      role: v.union(v.literal("player"), v.literal("judge")),
      name: v.string(),
      image: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      role: user.role,
      name: user.name,
      image: user.image,
    };
  },
});

// List all seasons
export const listSeasons = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("seasons"),
      _creationTime: v.number(),
      name: v.string(),
      start: v.number(),
      end: v.number(),
    })
  ),
  handler: async (ctx) => {
     const seasons = await ctx.db.query("seasons").order("desc").collect();
     return seasons.filter((s) => !s.deleted);
  },
});

// Get a season by id
export const getSeasonById = query({
  args: { id: v.id("seasons") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("seasons"),
      _creationTime: v.number(),
      name: v.string(),
      start: v.number(),
      end: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all tournaments
export const listTournaments = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      date: v.number(),
      winner: v.id("users"),
    })
  ),
  handler: async (ctx) => {
     const tournaments = await ctx.db.query("tournaments").order("desc").collect();
     return tournaments.filter((t) => !t.deleted);
  },
});

// Get a tournament by id
export const getTournamentById = query({
  args: { id: v.id("tournaments") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      date: v.number(),
      winner: v.id("users"),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get matches for a tournament
export const getTournamentMatches = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      date: v.number(),
      tournament: v.optional(v.id("tournaments")),
      winner: v.id("users"),
      winnerName: v.string(),
      loser: v.id("users"),
      loserName: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournament", args.tournamentId))
      .collect();

    const filtered = matches.filter((m) => !m.deleted);

    // Fetch player names for each match
    return await Promise.all(
      filtered.map(async (match) => {
        const winner = await ctx.db.get(match.winner);
        const loser = await ctx.db.get(match.loser);
        return {
          _id: match._id,
          _creationTime: match._creationTime,
          date: match.date,
          tournament: match.tournament,
          winner: match.winner,
          winnerName: winner?.name || "Unknown",
          loser: match.loser,
          loserName: loser?.name || "Unknown",
        };
      })
    );
  },
});

// Get all participants in a tournament
export const getTournamentParticipants = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      wins: v.number(),
      losses: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournament", args.tournamentId))
      .collect();

    const filtered = matches.filter((m) => !m.deleted);

    // Get unique participants and their record
    const participantMap = new Map<
      string,
      { userId: Id<"users">; name: string; wins: number; losses: number }
    >();

    for (const match of filtered) {
      const winner = await ctx.db.get(match.winner);
      const loser = await ctx.db.get(match.loser);

      const winnerId = match.winner;
      const loserId = match.loser;

      if (!participantMap.has(winnerId)) {
        participantMap.set(winnerId, {
          userId: winnerId,
          name: winner?.name || "Unknown",
          wins: 0,
          losses: 0,
        });
      }
      const winnerRecord = participantMap.get(winnerId)!;
      winnerRecord.wins += 1;

      if (!participantMap.has(loserId)) {
        participantMap.set(loserId, {
          userId: loserId,
          name: loser?.name || "Unknown",
          wins: 0,
          losses: 0,
        });
      }
      const loserRecord = participantMap.get(loserId)!;
      loserRecord.losses += 1;
    }

    // Convert to array and sort by wins descending
    const participants = Array.from(participantMap.values())
      .map((p) => ({
        _id: p.userId,
        name: p.name,
        wins: p.wins,
        losses: p.losses,
      }))
      .sort((a, b) => b.wins - a.wins);

    return participants;
  },
});

// List all matches
export const listMatches = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      date: v.number(),
      tournament: v.optional(v.id("tournaments")),
      winner: v.id("users"),
      loser: v.id("users"),
    })
  ),
  handler: async (ctx) => {
     const matches = await ctx.db.query("matches").order("desc").collect();
     return matches.filter((m) => !m.deleted);
  },
});

// Get a match by id
export const getMatchById = query({
  args: { id: v.id("matches") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      date: v.number(),
      tournament: v.optional(v.id("tournaments")),
      winner: v.id("users"),
      loser: v.id("users"),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get matches for a player
export const getPlayerMatches = query({
  args: { playerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("matches"),
      _creationTime: v.number(),
      date: v.number(),
      tournament: v.optional(v.id("tournaments")),
      tournamentName: v.optional(v.string()),
      tournamentDate: v.optional(v.number()),
      opponentId: v.id("users"),
      opponentName: v.optional(v.string()),
      playerWon: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await loadMatchesForPlayer(ctx, args.playerId);
    const userCache = new Map<string, Doc<"users"> | null>();
    const tournamentCache = new Map<string, Doc<"tournaments"> | null>();

    return Promise.all(
      matches.map(async (match) => {
        const playerWon = match.winner === args.playerId;
        const opponentId = playerWon ? match.loser : match.winner;

        if (!userCache.has(opponentId)) {
          userCache.set(opponentId, await ctx.db.get(opponentId));
        }

        let tournamentName: string | undefined;
        let tournamentDate: number | undefined;
        let tournamentId = match.tournament;

        if (tournamentId) {
          if (!tournamentCache.has(tournamentId)) {
            tournamentCache.set(tournamentId, await ctx.db.get(tournamentId));
          }
          const tournament = tournamentCache.get(tournamentId);
          if (tournament && !tournament.deleted) {
            tournamentName = tournament.name;
            tournamentDate = tournament.date;
          } else {
            tournamentId = undefined;
          }
        }

        const opponent = userCache.get(opponentId);

        return {
          _id: match._id,
          _creationTime: match._creationTime,
          date: match.date,
          tournament: tournamentId,
          tournamentName,
          tournamentDate,
          opponentId,
          opponentName: opponent?.name,
          playerWon,
        };
      })
    );
  },
});

// Get tournaments for a player
export const getPlayerTournaments = query({
  args: { playerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("tournaments"),
      _creationTime: v.number(),
      name: v.string(),
      date: v.number(),
      winner: v.id("users"),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await loadMatchesForPlayer(ctx, args.playerId);
    const tournamentIds = new Set<Id<"tournaments">>();

    for (const match of matches) {
      if (match.tournament) {
        tournamentIds.add(match.tournament);
      }
    }

    const tournaments: Array<Doc<"tournaments">> = [];
    for (const tournamentId of tournamentIds) {
      const tournament = await ctx.db.get(tournamentId);
      if (tournament && !tournament.deleted) {
        tournaments.push(tournament);
      }
    }

    return tournaments.map((tournament) => ({
      _id: tournament._id,
      _creationTime: tournament._creationTime,
      name: tournament.name,
      date: tournament.date,
      winner: tournament.winner,
    }));
  },
});

// Get seasons for a player
export const getPlayerSeasons = query({
  args: { playerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("seasons"),
      _creationTime: v.number(),
      name: v.string(),
      start: v.number(),
      end: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const matches = await loadMatchesForPlayer(ctx, args.playerId);
    const seasons = await ctx.db.query("seasons").collect();

    return seasons
      .filter((season) => !season.deleted)
      .filter((season) =>
        matches.some(
          (match) => match.date >= season.start && match.date <= season.end
        )
      )
      .map((season) => ({
        _id: season._id,
        _creationTime: season._creationTime,
        name: season.name,
        start: season.start,
        end: season.end,
      }));
  },
});

// Create a new player (for judges)
export const createPlayer = mutation({
  args: {
    name: v.string(),
    role: v.union(v.literal("player"), v.literal("judge")),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a player");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create players");
    }
    
    return await ctx.db.insert("users", {
      name: args.name,
      role: args.role,
    });
  },
});

// Create a new season (for judges)
export const createSeason = mutation({
  args: {
    name: v.string(),
    start: v.number(),
    end: v.number(),
  },
  returns: v.id("seasons"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a season");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create seasons");
    }
    
    return await ctx.db.insert("seasons", {
      name: args.name,
      start: args.start,
      end: args.end,
    });
  },
});

// Create a new tournament (for judges)
export const createTournament = mutation({
  args: {
    name: v.string(),
    date: v.number(),
    winner: v.id("users"),
  },
  returns: v.id("tournaments"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a tournament");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create tournaments");
    }
    
    return await ctx.db.insert("tournaments", {
      name: args.name,
      date: args.date,
      winner: args.winner,
    });
  },
});

// Create a new match (for judges)
export const createMatch = mutation({
  args: {
    date: v.number(),
    tournament: v.optional(v.id("tournaments")),
    winner: v.id("users"),
    loser: v.id("users"),
  },
  returns: v.id("matches"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to create a match");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can create matches");
    }

    const matchId = await ctx.db.insert("matches", {
      date: args.date,
      tournament: args.tournament,
      winner: args.winner,
      loser: args.loser,
    });

    const seasons = await ctx.db.query("seasons").collect();
    const affectedSeason = seasons.find(
      (s) => !s.deleted && args.date >= s.start && args.date <= s.end
    );

    if (affectedSeason) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: affectedSeason._id,
        fromTimestamp: args.date,
      });
    }

    return matchId;
  },
});

// Update a season (for judges)
export const updateSeason = mutation({
  args: {
    id: v.id("seasons"),
    name: v.string(),
    start: v.number(),
    end: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a season");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can update seasons");
    }
    
    await ctx.db.patch(args.id, {
      name: args.name,
      start: args.start,
      end: args.end,
    });
    return null;
  },
});

// Delete a season (soft delete for judges)
export const deleteSeason = mutation({
  args: { id: v.id("seasons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a season");
    }
    
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can delete seasons");
    }
    
    await ctx.db.patch(args.id, { deleted: true });
    return null;
  },
});

// Update a tournament (for judges)
export const updateTournament = mutation({
  args: {
    id: v.id("tournaments"),
    name: v.string(),
    date: v.number(),
    winner: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a tournament");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can update tournaments");
    }

    const oldTournament = await ctx.db.get(args.id);
    if (!oldTournament) {
      throw new Error("Tournament not found");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      date: args.date,
      winner: args.winner,
    });

    const seasons = await ctx.db.query("seasons").collect();
    const oldSeason = seasons.find(
      (s) => !s.deleted && oldTournament.date >= s.start && oldTournament.date <= s.end
    );
    const newSeason = seasons.find(
      (s) => !s.deleted && args.date >= s.start && args.date <= s.end
    );

    if (oldSeason && oldSeason._id !== newSeason?._id) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: oldSeason._id,
        fromTimestamp: oldTournament.date,
      });
    }

    if (newSeason) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: newSeason._id,
        fromTimestamp: args.date,
      });
    }

    return null;
  },
});

// Delete a tournament (soft delete for judges)
export const deleteTournament = mutation({
  args: { id: v.id("tournaments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a tournament");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can delete tournaments");
    }

    const tournament = await ctx.db.get(args.id);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    await ctx.db.patch(args.id, { deleted: true });

    const seasons = await ctx.db.query("seasons").collect();
    const affectedSeason = seasons.find(
      (s) => !s.deleted && tournament.date >= s.start && tournament.date <= s.end
    );

    if (affectedSeason) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: affectedSeason._id,
        fromTimestamp: tournament.date,
      });
    }

    return null;
  },
});

// Update a match (for judges)
export const updateMatch = mutation({
  args: {
    id: v.id("matches"),
    date: v.number(),
    tournament: v.optional(v.id("tournaments")),
    winner: v.id("users"),
    loser: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to update a match");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can update matches");
    }

    const oldMatch = await ctx.db.get(args.id);
    if (!oldMatch) {
      throw new Error("Match not found");
    }

    await ctx.db.patch(args.id, {
      date: args.date,
      tournament: args.tournament,
      winner: args.winner,
      loser: args.loser,
    });

    const seasons = await ctx.db.query("seasons").collect();
    const oldSeason = seasons.find(
      (s) => !s.deleted && oldMatch.date >= s.start && oldMatch.date <= s.end
    );
    const newSeason = seasons.find(
      (s) => !s.deleted && args.date >= s.start && args.date <= s.end
    );

    if (oldSeason && oldSeason._id !== newSeason?._id) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: oldSeason._id,
        fromTimestamp: oldMatch.date,
      });
    }

    if (newSeason) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: newSeason._id,
        fromTimestamp: args.date,
      });
    }

    return null;
  },
});

// Delete a match (soft delete for judges)
export const deleteMatch = mutation({
  args: { id: v.id("matches") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to delete a match");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can delete matches");
    }

    const match = await ctx.db.get(args.id);
    if (!match) {
      throw new Error("Match not found");
    }

    await ctx.db.patch(args.id, { deleted: true });

    const seasons = await ctx.db.query("seasons").collect();
    const affectedSeason = seasons.find(
      (s) => !s.deleted && match.date >= s.start && match.date <= s.end
    );

    if (affectedSeason) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: affectedSeason._id,
        fromTimestamp: match.date,
      });
    }

    return null;
  },
});

// Get a preview of merging two user accounts
export const getMergePreview = mutation({
  args: {
    sourceUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  returns: v.object({
    source: v.object({
      _id: v.id("users"),
      name: v.string(),
      role: v.union(v.literal("player"), v.literal("judge")),
    }),
    target: v.object({
      _id: v.id("users"),
      name: v.string(),
      role: v.union(v.literal("player"), v.literal("judge")),
      hasAccount: v.boolean(),
    }),
    counts: v.object({
      matchesAsWinner: v.number(),
      matchesAsLoser: v.number(),
      tournamentWins: v.number(),
      eloSnapshots: v.number(),
    }),
    affectedSeasonIds: v.array(v.id("seasons")),
  }),
  handler: async (ctx, args) => {
    // Validate judge authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to merge accounts");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can merge accounts");
    }

    // Validate source and target exist
    const source = await ctx.db.get(args.sourceUserId);
    if (!source || source.deleted) {
      throw new Error("Source account not found or has been deleted");
    }

    const target = await ctx.db.get(args.targetUserId);
    if (!target || target.deleted) {
      throw new Error("Target account not found or has been deleted");
    }

    // Check they're not the same
    if (args.sourceUserId === args.targetUserId) {
      throw new Error("Cannot merge an account into itself");
    }

    // Verify source is non-claimed (no auth account)
    const authAccounts = await ctx.db.query("authAccounts").collect();
    const sourceAuthAccount = authAccounts.find(a => a.userId === args.sourceUserId);
    if (sourceAuthAccount) {
      throw new Error("Source account is claimed and cannot be merged. Only non-claimed accounts can be merged.");
    }

    // Check for conflicts: matches where source and target played each other
    const allMatches = await ctx.db.query("matches").collect();
    const conflictMatches = allMatches.filter(m =>
      !m.deleted && (
        (m.winner === args.sourceUserId && m.loser === args.targetUserId) ||
        (m.winner === args.targetUserId && m.loser === args.sourceUserId)
      )
    );

    if (conflictMatches.length > 0) {
      throw new Error(
        `Cannot merge: these accounts have played ${conflictMatches.length} match${conflictMatches.length > 1 ? 'es' : ''} against each other`
      );
    }

    // Count related data
    const matchesAsWinner = await ctx.db
      .query("matches")
      .withIndex("by_winner", (q) => q.eq("winner", args.sourceUserId))
      .collect();
    const matchesAsWinnerCount = matchesAsWinner.filter(m => !m.deleted).length;

    const matchesAsLoser = await ctx.db
      .query("matches")
      .withIndex("by_loser", (q) => q.eq("loser", args.sourceUserId))
      .collect();
    const matchesAsLoserCount = matchesAsLoser.filter(m => !m.deleted).length;

    const tournaments = await ctx.db.query("tournaments").collect();
    const tournamentWinsCount = tournaments.filter(t => !t.deleted && t.winner === args.sourceUserId).length;

    const eloSnapshots = await ctx.db.query("eloSnapshots").collect();
    const eloSnapshotsCount = eloSnapshots.filter(e => e.playerId === args.sourceUserId).length;

    // Find affected seasons
    const seasons = await ctx.db.query("seasons").collect();
    const allSourceMatches = [...matchesAsWinner, ...matchesAsLoser].filter(m => !m.deleted);
    const affectedSeasonIds = seasons
      .filter(s => !s.deleted && allSourceMatches.some(m => m.date >= s.start && m.date <= s.end))
      .map(s => s._id);

    // Check if target has auth account
    const targetAuthAccount = authAccounts.find(a => a.userId === args.targetUserId);

    return {
      source: {
        _id: source._id,
        name: source.name,
        role: source.role,
      },
      target: {
        _id: target._id,
        name: target.name,
        role: target.role,
        hasAccount: !!targetAuthAccount,
      },
      counts: {
        matchesAsWinner: matchesAsWinnerCount,
        matchesAsLoser: matchesAsLoserCount,
        tournamentWins: tournamentWinsCount,
        eloSnapshots: eloSnapshotsCount,
      },
      affectedSeasonIds,
    };
  },
});

// Public mutation to merge user accounts
export const mergeUserAccounts = mutation({
  args: {
    sourceUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    stats: v.object({
      matchesUpdated: v.number(),
      tournamentsUpdated: v.number(),
      eloSnapshotsDeleted: v.number(),
    }),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Validate judge authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be authenticated to merge accounts");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "judge") {
      throw new Error("Only judges can merge accounts");
    }

    // Re-validate accounts exist and meet requirements
    const source = await ctx.db.get(args.sourceUserId);
    if (!source || source.deleted) {
      throw new Error("Source account not found or has been deleted");
    }

    const target = await ctx.db.get(args.targetUserId);
    if (!target || target.deleted) {
      throw new Error("Target account not found or has been deleted");
    }

    if (args.sourceUserId === args.targetUserId) {
      throw new Error("Cannot merge an account into itself");
    }

    // Verify source is non-claimed
    const authAccounts = await ctx.db.query("authAccounts").collect();
    const sourceAuthAccount = authAccounts.find(a => a.userId === args.sourceUserId);
    if (sourceAuthAccount) {
      throw new Error("Source account is claimed and cannot be merged. Only non-claimed accounts can be merged.");
    }

    // Check for conflicts
    const allMatches = await ctx.db.query("matches").collect();
    const conflictMatches = allMatches.filter(m =>
      !m.deleted && (
        (m.winner === args.sourceUserId && m.loser === args.targetUserId) ||
        (m.winner === args.targetUserId && m.loser === args.sourceUserId)
      )
    );

    if (conflictMatches.length > 0) {
      throw new Error(
        `Cannot merge: these accounts have played ${conflictMatches.length} match${conflictMatches.length > 1 ? 'es' : ''} against each other`
      );
    }

    // Perform the merge - inline to avoid circular reference
    let matchesUpdated = 0;
    let tournamentsUpdated = 0;
    let eloSnapshotsDeleted = 0;

    // Update matches where source is winner
    const matchesAsWinner = await ctx.db
      .query("matches")
      .withIndex("by_winner", (q) => q.eq("winner", args.sourceUserId))
      .collect();

    for (const match of matchesAsWinner) {
      await ctx.db.patch(match._id, { winner: args.targetUserId });
      matchesUpdated++;
    }

    // Update matches where source is loser
    const matchesAsLoser = await ctx.db
      .query("matches")
      .withIndex("by_loser", (q) => q.eq("loser", args.sourceUserId))
      .collect();

    for (const match of matchesAsLoser) {
      await ctx.db.patch(match._id, { loser: args.targetUserId });
      matchesUpdated++;
    }

    // Update tournaments where source is winner
    const tournaments = await ctx.db.query("tournaments").collect();
    const sourceTournaments = tournaments.filter(t => t.winner === args.sourceUserId);

    for (const tournament of sourceTournaments) {
      await ctx.db.patch(tournament._id, { winner: args.targetUserId });
      tournamentsUpdated++;
    }

    // Delete source player's ELO snapshots
    // The recalculateSeasonElo function will regenerate them correctly for the merged account
    const eloSnapshots = await ctx.db.query("eloSnapshots").collect();
    const sourceEloSnapshots = eloSnapshots.filter(e => e.playerId === args.sourceUserId);

    for (const snapshot of sourceEloSnapshots) {
      await ctx.db.delete(snapshot._id);
      eloSnapshotsDeleted++;
    }

    // Soft delete source user
    await ctx.db.patch(args.sourceUserId, { deleted: true });

    const stats = {
      matchesUpdated,
      tournamentsUpdated,
      eloSnapshotsDeleted,
    };

    // Identify affected seasons and trigger ELO recalculation
    const seasons = await ctx.db.query("seasons").collect();
    const targetMatches = await ctx.db.query("matches").collect();
    const relevantMatches = targetMatches.filter(m =>
      !m.deleted && (m.winner === args.targetUserId || m.loser === args.targetUserId)
    );

    const affectedSeasons = seasons.filter(s =>
      !s.deleted && relevantMatches.some(m => m.date >= s.start && m.date <= s.end)
    );

    for (const season of affectedSeasons) {
      const seasonMatches = relevantMatches.filter(m => m.date >= season.start && m.date <= season.end);
      const earliestMatch = seasonMatches.reduce((earliest, m) =>
        m.date < earliest ? m.date : earliest,
        seasonMatches[0]?.date || season.start
      );

      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: season._id,
        fromTimestamp: earliestMatch,
      });
    }

    return {
      success: true,
      stats,
      message: `Successfully merged ${source.name} into ${target.name}. ELO recalculation scheduled for ${affectedSeasons.length} season(s).`,
    };
  },
});