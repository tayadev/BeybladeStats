import { query } from "./_generated/server";
import { v } from "convex/values";
import { calculateInactivityPenalty } from "./eloCalculations";

export const getPlayerCurrentElo = query({
  args: {
    playerId: v.id("users"),
    seasonId: v.id("seasons"),
  },
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.seasonId);
    if (!season || season.deleted) {
      return null;
    }

    const snapshots = await ctx.db
      .query("eloSnapshots")
      .withIndex("by_player_season", (q) =>
        q.eq("playerId", args.playerId).eq("seasonId", args.seasonId)
      )
      .order("desc")
      .take(1);

    if (snapshots.length === 0) {
      return null;
    }

    const latestSnapshot = snapshots[0];
    const currentTime = Date.now();

    const penalty = calculateInactivityPenalty(
      latestSnapshot.elo,
      latestSnapshot.timestamp,
      currentTime,
      season.end
    );

    return {
      baseElo: latestSnapshot.elo,
      inactivityPenalty: penalty,
      currentElo: latestSnapshot.elo - penalty,
      lastActivityTimestamp: latestSnapshot.timestamp,
      isInactive: penalty > 0,
    };
  },
});

export const getSeasonLeaderboard = query({
  args: {
    seasonId: v.id("seasons"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.seasonId);
    if (!season) return [];

    const allSnapshots = await ctx.db
      .query("eloSnapshots")
      .withIndex("by_season", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const latestByPlayer = new Map();
    for (const snapshot of allSnapshots) {
      const existing = latestByPlayer.get(snapshot.playerId);
      if (!existing || snapshot.timestamp > existing.timestamp) {
        latestByPlayer.set(snapshot.playerId, snapshot);
      }
    }

    const currentTime = Date.now();
    const leaderboard = [];

    for (const [playerId, snapshot] of latestByPlayer) {
      const player = await ctx.db.get(playerId);
      if (!player || !("role" in player)) continue;

      const penalty = calculateInactivityPenalty(
        snapshot.elo,
        snapshot.timestamp,
        currentTime,
        season.end
      );

      leaderboard.push({
        playerId,
        playerName: player.name,
        playerImage: player.image || undefined,
        baseElo: snapshot.elo,
        inactivityPenalty: penalty,
        currentElo: snapshot.elo - penalty,
        lastActivityTimestamp: snapshot.timestamp,
      });
    }

    leaderboard.sort((a, b) => b.currentElo - a.currentElo);

    return args.limit ? leaderboard.slice(0, args.limit) : leaderboard;
  },
});

export const getPlayerEloHistory = query({
  args: {
    playerId: v.id("users"),
    seasonId: v.id("seasons"),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("eloSnapshots")
      .withIndex("by_player_season", (q) =>
        q.eq("playerId", args.playerId).eq("seasonId", args.seasonId)
      )
      .order("asc")
      .collect();

    return snapshots.map((s) => ({
      elo: s.elo,
      timestamp: s.timestamp,
      matchId: s.matchId,
      tournamentBonusId: s.tournamentBonusId,
      metadata: s.calculationMetadata,
    }));
  },
});

export const getPlayerSeasonStats = query({
  args: {
    playerId: v.id("users"),
    seasonId: v.id("seasons"),
  },
  handler: async (ctx, args) => {
    const season = await ctx.db.get(args.seasonId);
    if (!season) return null;

    const allMatches = await ctx.db.query("matches").collect();
    const playerMatches = allMatches.filter(
      (m) =>
        !m.deleted &&
        (m.winner === args.playerId || m.loser === args.playerId) &&
        m.date >= season.start &&
        m.date <= season.end
    );

    const wins = playerMatches.filter((m) => m.winner === args.playerId).length;
    const losses = playerMatches.filter((m) => m.loser === args.playerId).length;

    const snapshots = await ctx.db
      .query("eloSnapshots")
      .withIndex("by_player_season", (q) =>
        q.eq("playerId", args.playerId).eq("seasonId", args.seasonId)
      )
      .collect();

    const highestElo = snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.elo)) : 0;

    let currentElo = 0;
    if (snapshots.length > 0) {
      const latestSnapshot = snapshots[snapshots.length - 1];
      const currentTime = Date.now();
      const penalty = calculateInactivityPenalty(
        latestSnapshot.elo,
        latestSnapshot.timestamp,
        currentTime,
        season.end
      );
      currentElo = latestSnapshot.elo - penalty;
    }

    return {
      wins,
      losses,
      totalMatches: wins + losses,
      winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
      currentElo,
      highestElo,
    };
  },
});
