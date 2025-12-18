import { Metadata } from "next";
import TournamentClient from "./TournamentClient";

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
      title: "Invalid Tournament ID",
      description: "The tournament ID provided is invalid.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  try {
    // Fetch tournament data from HTTP API
    const response = await fetch(`${convexUrl}/api/tournament/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return {
        title: "Tournament Not Found",
        description: "The tournament you're looking for doesn't exist.",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const tournament = await response.json();

    const tournamentDate = new Date(tournament.date).toLocaleDateString();
    const title = tournament.name;
    const description = `Winner: ${tournament.winner.name} | ${tournament.participantCount} participants | ${tournamentDate}`;
    const ogImageUrl = `${baseUrl}/api/og/tournament/${id}`;

    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        url: `${baseUrl}/tournament/${id}`,
        siteName: "BLG Beyblade Stats",
        publishedTime: new Date(tournament.date).toISOString(),
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${tournament.name} - BLG Beyblade Stats`,
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
      title: "Tournament",
      description: "View tournament details and results.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default function TournamentPage() {
  return <TournamentClient />;
}
