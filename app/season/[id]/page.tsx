import { Metadata } from "next";
import SeasonClient from "./SeasonClient";

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
      title: "Invalid Season ID",
      description: "The season ID provided is invalid.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  try {
    // Fetch season data from HTTP API
    const response = await fetch(`${convexUrl}/api/season/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return {
        title: "Season Not Found",
        description: "The season you're looking for doesn't exist.",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const season = await response.json();

    const startDate = new Date(season.start).toLocaleDateString();
    const endDate = new Date(season.end).toLocaleDateString();
    const title = season.name;
    const description = `${startDate} - ${endDate}. View leaderboard and tournaments.`;
    const ogImageUrl = `${baseUrl}/api/og/season/${id}`;

    return {
      title,
      description,
      openGraph: {
        type: "website",
        title,
        description,
        url: `${baseUrl}/season/${id}`,
        siteName: "BLG Beyblade Stats",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${season.name} - BLG Beyblade Stats`,
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
      title: "Season",
      description: "View season details and leaderboard.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default function SeasonPage() {
  return <SeasonClient />;
}
