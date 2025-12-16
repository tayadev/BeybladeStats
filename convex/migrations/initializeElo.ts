import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const initializeEloForAllSeasons = internalMutation({
  handler: async (ctx) => {
    const seasons = await ctx.db.query("seasons").collect();
    const activeSeasons = seasons.filter((s) => !s.deleted);

    for (const season of activeSeasons) {
      await ctx.scheduler.runAfter(0, internal.eloRecalculation.recalculateSeasonElo, {
        seasonId: season._id,
      });
    }

    return { seasonsProcessed: activeSeasons.length };
  },
});
