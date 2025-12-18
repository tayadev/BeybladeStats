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

    // Fetch season data from HTTP API
    const response = await fetch(`${convexUrl}/api/season/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Season not found");
    }

    const season = await response.json();
    const startDate = new Date(season.start).toLocaleDateString();
    const endDate = new Date(season.end).toLocaleDateString();

    const medals = ["🥇", "🥈", "🥉"];

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
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
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
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
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
              textAlign: "center",
            }}
          >
            {/* Season name */}
            <div
              style={{
                fontSize: 72,
                fontWeight: "bold",
                color: "white",
                marginBottom: 20,
                textAlign: "center",
                display: "flex",
              }}
            >
              {season.name}
            </div>

            {/* Date range */}
            <div
              style={{
                fontSize: 32,
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: 50,
                display: "flex",
              }}
            >
              {startDate} - {endDate}
            </div>

            {/* Top 3 players */}
            {season.topPlayers && season.topPlayers.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  width: "100%",
                  maxWidth: "700px",
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  Top Players
                </div>
                {season.topPlayers.slice(0, 3).map((player: any, index: number) => (
                  <div
                    key={player._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "20px 30px",
                      background: "rgba(255, 255, 255, 0.2)",
                      borderRadius: 15,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 48,
                          display: "flex",
                        }}
                      >
                        {medals[index]}
                      </div>
                      <div
                        style={{
                          fontSize: 36,
                          fontWeight: "bold",
                          color: "white",
                          display: "flex",
                        }}
                      >
                        {player.name}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: "bold",
                        color: "rgba(255, 255, 255, 0.9)",
                        display: "flex",
                      }}
                    >
                      {Math.round(player.elo)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.7)",
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
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
            Season Not Found
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
