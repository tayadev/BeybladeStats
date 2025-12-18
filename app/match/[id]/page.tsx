import { Metadata } from "next";
import MatchClient from "./MatchClient";

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
      title: "Invalid Match ID",
      description: "The match ID provided is invalid.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  try {
    // Fetch match data from HTTP API
    const response = await fetch(`${convexUrl}/api/match/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return {
        title: "Match Not Found",
        description: "The match you're looking for doesn't exist.",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const match = await response.json();

    const matchDate = new Date(match.date).toLocaleDateString();
    const title = `${match.winner.name} vs ${match.loser.name}`;
    const description = `${match.winner.name} won | ${matchDate}${match.tournament ? ` | ${match.tournament}` : ""}`;
    const ogImageUrl = `${baseUrl}/api/og/match/${id}`;

    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        url: `${baseUrl}/match/${id}`,
        siteName: "BLG Beyblade Stats",
        publishedTime: new Date(match.date).toISOString(),
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${match.winner.name} vs ${match.loser.name} - BLG Beyblade Stats`,
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
      title: "Match",
      description: "View match details and results.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default function MatchPage() {
  return <MatchClient />;
}
