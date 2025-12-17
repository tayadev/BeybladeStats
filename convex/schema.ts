import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  users: defineTable({
    role: v.union(v.literal("player"), v.literal("judge")),
    name: v.string(),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  }),
  seasons: defineTable({
    name: v.string(),
    start: v.number(),
    end: v.number(),
    deleted: v.optional(v.boolean()),
  }),
  tournaments: defineTable({
    name: v.string(),
    date: v.number(),
    winner: v.id("users"),
    deleted: v.optional(v.boolean()),
  })
    .index("by_date", ["date"]),
  matches: defineTable({
    date: v.number(),
    tournament: v.optional(v.id("tournaments")),
    winner: v.id("users"),
    loser: v.id("users"),
    deleted: v.optional(v.boolean()),
  })
    .index("by_winner", ["winner"])
    .index("by_loser", ["loser"])
    .index("by_tournament", ["tournament"])
    .index("by_date", ["date"]),
  eloSnapshots: defineTable({
    playerId: v.id("users"),
    seasonId: v.id("seasons"),
    elo: v.number(),
    matchId: v.optional(v.id("matches")),
    tournamentBonusId: v.optional(v.id("tournaments")),
    timestamp: v.number(),
    calculationMetadata: v.object({
      pointsLost: v.optional(v.number()),
      pointsGained: v.optional(v.number()),
      tournamentBonus: v.optional(v.number()),
      reason: v.string(),
    }),
  })
    .index("by_player_season", ["playerId", "seasonId", "timestamp"])
    .index("by_season", ["seasonId", "timestamp"])
    .index("by_match", ["matchId"]),
});
