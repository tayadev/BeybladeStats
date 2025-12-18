import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

auth.addHttpRoutes(http);

// Player endpoint for metadata
http.route({
  path: "/api/player/:id",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() as Id<"users">;

    try {
      // Fetch player data
      const player = await ctx.runQuery(api.myFunctions.getUserById, {
        id,
      });

      if (!player) {
        return new Response(JSON.stringify({ error: "Player not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        });
      }

      // Get player matches for stats
      const matches = await ctx.runQuery(api.myFunctions.getPlayerMatches, {
        playerId: id,
      });
      const wins = matches.filter((m: any) => m.playerWon).length;
      const losses = matches.length - wins;

      // Get current ELO (use default for now - metadata doesn't need real-time accuracy)
      const currentElo = 1000; // Simplified - metadata is static at share time

      const data = {
        _id: player._id,
        name: player.name,
        role: player.role,
        image: player.image,
        currentElo,
        wins,
        losses,
        totalMatches: wins + losses,
        winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      };

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || "Internal server error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }),
});

// Tournament endpoint for metadata
http.route({
  path: "/api/tournament/:id",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() as Id<"tournaments">;

    try {
      const tournament = await ctx.runQuery(api.myFunctions.getTournamentById, {
        id,
      });

      if (!tournament) {
        return new Response(JSON.stringify({ error: "Tournament not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        });
      }

      // Get tournament matches and participants
      const matches = await ctx.runQuery(api.myFunctions.getTournamentMatches, {
        tournamentId: id,
      });
      const participants = await ctx.runQuery(
        api.myFunctions.getTournamentParticipants,
        {
          tournamentId: id,
        }
      );

      // Get winner name
      const winner = await ctx.runQuery(api.myFunctions.getUserById, {
        id: tournament.winner,
      });

      const data = {
        _id: tournament._id,
        name: tournament.name,
        date: tournament.date,
        winner: {
          _id: tournament.winner,
          name: winner?.name || "Unknown",
        },
        matchCount: matches.length,
        participantCount: participants.length,
      };

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || "Internal server error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }),
});

// Match endpoint for metadata
http.route({
  path: "/api/match/:id",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() as Id<"matches">;

    try {
      const match = await ctx.runQuery(api.myFunctions.getMatchById, {
        id,
      });

      if (!match) {
        return new Response(JSON.stringify({ error: "Match not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        });
      }

      // Get winner and loser data
      const winner = await ctx.runQuery(api.myFunctions.getUserById, {
        id: match.winner,
      });
      const loser = await ctx.runQuery(api.myFunctions.getUserById, {
        id: match.loser,
      });

      // Get ELO changes
      const eloChanges = await ctx.runQuery(api.eloQueries.getMatchEloChanges, {
        matchId: id,
      });

      // Get tournament context if applicable
      let tournamentName = null;
      if (match.tournament) {
        const tournament = await ctx.runQuery(
          api.myFunctions.getTournamentById,
          {
            id: match.tournament,
          }
        );
        tournamentName = tournament?.name || null;
      }

      const data = {
        _id: match._id,
        date: match.date,
        winner: {
          _id: match.winner,
          name: winner?.name || "Unknown",
          eloChange: eloChanges?.winner || null,
        },
        loser: {
          _id: match.loser,
          name: loser?.name || "Unknown",
          eloChange: eloChanges?.loser || null,
        },
        tournament: tournamentName,
      };

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || "Internal server error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }),
});

// Season endpoint for metadata
http.route({
  path: "/api/season/:id",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop() as Id<"seasons">;

    try {
      const season = await ctx.runQuery(api.myFunctions.getSeasonById, {
        id,
      });

      if (!season) {
        return new Response(JSON.stringify({ error: "Season not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        });
      }

      // Simplified: No leaderboard for metadata (static at share time)
      const topPlayers: any[] = [];

      const data = {
        _id: season._id,
        name: season.name,
        start: season.start,
        end: season.end,
        topPlayers,
      };

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message || "Internal server error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }),
});

export default http;
