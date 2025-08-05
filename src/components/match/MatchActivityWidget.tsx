// ===== src/components/match/MatchActivityWidget.tsx =====
import "server-only"; // Ensures this component only ever runs on the server
import axios from "axios";
import MatchActivityClient from "./MatchActivityClient"; // Import the new Client Component

interface MatchEvent {
  time: { elapsed: number };
  team: { id: number; name: string; logo: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string;
}

interface MatchActivityWidgetProps {
  fixtureId: string;
  isLive: boolean;
  homeTeamId: number;
  activitySeoDescription: string;
}

// Server-side data fetching function
const fetchInitialFixtureEvents = async (
  fixtureId: string
): Promise<MatchEvent[]> => {
  try {
    // We use the full URL here because this is a server-to-server fetch
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/match-details?fixture=${fixtureId}`
    );
    return data?.events || [];
  } catch (error) {
    console.error(
      `[MatchActivityWidget] Failed to fetch initial events for fixture ${fixtureId}:`,
      error
    );
    return []; // Return an empty array on failure to prevent page crashes
  }
};

// This is now an async Server Component
export default async function MatchActivityWidget({
  fixtureId,
  isLive,
  homeTeamId,
  activitySeoDescription,
}: MatchActivityWidgetProps) {
  // 1. Fetch the initial data on the server.
  const initialEvents = await fetchInitialFixtureEvents(fixtureId);

  // 2. Render the Client Component and pass the server-fetched data as a prop.
  return (
    <MatchActivityClient
      initialEvents={initialEvents}
      fixtureId={fixtureId}
      isLive={isLive}
      homeTeamId={homeTeamId}
      activitySeoDescription={activitySeoDescription}
    />
  );
}
