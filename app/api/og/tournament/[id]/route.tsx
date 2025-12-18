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

    // Fetch tournament data from HTTP API
    const response = await fetch(`${convexUrl}/api/tournament/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Tournament not found");
    }

    const tournament = await response.json();
    const tournamentDate = new Date(tournament.date).toLocaleDateString();

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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
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
              background: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
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
            {/* Trophy icon (using text emoji) */}
            <div
              style={{
                fontSize: 120,
                marginBottom: 30,
                display: "flex",
              }}
            >
              🏆
            </div>

            {/* Tournament name */}
            <div
              style={{
                fontSize: 64,
                fontWeight: "bold",
                color: "white",
                marginBottom: 40,
                textAlign: "center",
                display: "flex",
                maxWidth: "90%",
              }}
            >
              {tournament.name}
            </div>

            {/* Winner */}
            <div
              style={{
                fontSize: 40,
                color: "rgba(255, 255, 255, 0.95)",
                marginBottom: 40,
                display: "flex",
                alignItems: "center",
                gap: 15,
              }}
            >
              <span style={{ display: "flex" }}>Winner:</span>
              <span style={{ fontWeight: "bold", display: "flex" }}>{tournament.winner.name}</span>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                gap: 50,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "20px 30px",
                  background: "rgba(255, 255, 255, 0.15)",
                  borderRadius: 15,
                  minWidth: 150,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: "white",
                    display: "flex",
                  }}
                >
                  {tournament.participantCount}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: "rgba(255, 255, 255, 0.8)",
                    marginTop: 5,
                    display: "flex",
                  }}
                >
                  Players
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "20px 30px",
                  background: "rgba(255, 255, 255, 0.15)",
                  borderRadius: 15,
                  minWidth: 150,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: "white",
                    display: "flex",
                  }}
                >
                  {tournament.matchCount}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: "rgba(255, 255, 255, 0.8)",
                    marginTop: 5,
                    display: "flex",
                  }}
                >
                  Matches
                </div>
              </div>
            </div>

            {/* Date */}
            <div
              style={{
                fontSize: 28,
                color: "rgba(255, 255, 255, 0.8)",
                marginTop: 40,
                display: "flex",
              }}
            >
              {tournamentDate}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.6)",
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            Tournament Not Found
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
