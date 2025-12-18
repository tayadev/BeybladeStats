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

    // Fetch match data from HTTP API
    const response = await fetch(`${convexUrl}/api/match/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Match not found");
    }

    const match = await response.json();
    const matchDate = new Date(match.date).toLocaleDateString();

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
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              height: "60%",
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
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
              padding: "60px",
              zIndex: 1,
              width: "100%",
            }}
          >
            {/* Date */}
            <div
              style={{
                fontSize: 24,
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: 30,
                display: "flex",
              }}
            >
              {matchDate}
            </div>

            {/* Players */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 60,
                width: "100%",
                maxWidth: "1000px",
              }}
            >
              {/* Winner */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "40px",
                  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%)",
                  borderRadius: 20,
                  border: "3px solid rgba(34, 197, 94, 0.5)",
                  flex: 1,
                  minWidth: 300,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: "rgb(74, 222, 128)",
                    fontWeight: "bold",
                    marginBottom: 15,
                    display: "flex",
                  }}
                >
                  WINNER
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: 20,
                    textAlign: "center",
                    display: "flex",
                  }}
                >
                  {match.winner.name}
                </div>
                {match.winner.eloChange && (
                  <div
                    style={{
                      fontSize: 36,
                      color: "rgb(74, 222, 128)",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    +{match.winner.eloChange.pointsGained}
                  </div>
                )}
              </div>

              {/* VS Divider */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: "rgba(255, 255, 255, 0.4)",
                    display: "flex",
                  }}
                >
                  VS
                </div>
              </div>

              {/* Loser */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "40px",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)",
                  borderRadius: 20,
                  border: "3px solid rgba(239, 68, 68, 0.5)",
                  flex: 1,
                  minWidth: 300,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    color: "rgb(252, 165, 165)",
                    fontWeight: "bold",
                    marginBottom: 15,
                    display: "flex",
                  }}
                >
                  LOSER
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: 20,
                    textAlign: "center",
                    display: "flex",
                  }}
                >
                  {match.loser.name}
                </div>
                {match.loser.eloChange && (
                  <div
                    style={{
                      fontSize: 36,
                      color: "rgb(252, 165, 165)",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {match.loser.eloChange.pointsLost}
                  </div>
                )}
              </div>
            </div>

            {/* Tournament context */}
            {match.tournament && (
              <div
                style={{
                  fontSize: 24,
                  color: "rgba(255, 255, 255, 0.7)",
                  marginTop: 40,
                  display: "flex",
                }}
              >
                Tournament: {match.tournament}
              </div>
            )}
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
            Match Not Found
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
