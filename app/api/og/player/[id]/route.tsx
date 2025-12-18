import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

    // Fetch player data from HTTP API
    const response = await fetch(`${convexUrl}/api/player/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Player not found");
    }

    const player = await response.json();

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            fontFamily: "system-ui",
            position: "relative",
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: "absolute",
              top: "-10%",
              right: "-5%",
              width: "40%",
              height: "80%",
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
              borderRadius: "50%",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              left: "-5%",
              width: "40%",
              height: "80%",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
              borderRadius: "50%",
              display: "flex",
            }}
          />

          {/* Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px",
              zIndex: 1,
            }}
          >
            {/* Player name */}
            <div
              style={{
                fontSize: 72,
                fontWeight: "bold",
                color: "white",
                marginBottom: 40,
                textAlign: "center",
                display: "flex",
              }}
            >
              {player.name}
            </div>

            {/* Stats grid */}
            <div
              style={{
                display: "flex",
                gap: 40,
                marginTop: 20,
              }}
            >
              {/* Current ELO */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "30px 40px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 20,
                  minWidth: 200,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: "rgba(255, 255, 255, 0.7)",
                    marginBottom: 10,
                    display: "flex",
                  }}
                >
                  Current ELO
                </div>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: "bold",
                    color: "white",
                    display: "flex",
                  }}
                >
                  {Math.round(player.currentElo)}
                </div>
              </div>

              {/* Win Rate */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "30px 40px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 20,
                  minWidth: 200,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: "rgba(255, 255, 255, 0.7)",
                    marginBottom: 10,
                    display: "flex",
                  }}
                >
                  Win Rate
                </div>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: "bold",
                    color: "white",
                    display: "flex",
                  }}
                >
                  {player.winRate.toFixed(0)}%
                </div>
              </div>

              {/* Record */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "30px 40px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 20,
                  minWidth: 200,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: "rgba(255, 255, 255, 0.7)",
                    marginBottom: 10,
                    display: "flex",
                  }}
                >
                  Record
                </div>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: "bold",
                    color: "white",
                    display: "flex",
                  }}
                >
                  {player.wins}W-{player.losses}L
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.5)",
              display: "flex",
            }}
          >
            BLG Beyblade Stats
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    // Return error image
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            fontFamily: "system-ui",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: "bold",
              color: "white",
              display: "flex",
            }}
          >
            Player Not Found
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255, 255, 255, 0.7)",
              marginTop: 20,
              display: "flex",
            }}
          >
            BLG Beyblade Stats
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
