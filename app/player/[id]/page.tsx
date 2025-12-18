import { Metadata } from "next";
import PlayerClient from "./PlayerClient";

// Force dynamic rendering so metadata can fetch from Convex at request time
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // Validate ID format
  const isPlausibleConvexId = (s: string) => /^[a-z0-9]{10,}$/i.test(s);
  if (!isPlausibleConvexId(id)) {
    return {
      title: "Invalid Player ID",
      description: "The player ID provided is invalid.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  try {
    // Fetch player data from HTTP API
    const response = await fetch(`${convexUrl}/api/player/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return {
        title: "Player Not Found",
        description: "The player you're looking for doesn't exist.",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const player = await response.json();

    const title = player.name;
    const description = `View ${player.name}'s stats: ${player.wins}W-${player.losses}L, ELO: ${Math.round(player.currentElo)}`;
    const ogImageUrl = `${baseUrl}/api/og/player/${id}`;

    return {
      title,
      description,
      openGraph: {
        type: "profile",
        title,
        description,
        url: `${baseUrl}/player/${id}`,
        siteName: "BLG Beyblade Stats",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${player.name} - BLG Beyblade Stats`,
          },
        ],
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Player Profile",
      description: "View player statistics and match history.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default function PlayerPage() {
  return <PlayerClient />;
}
