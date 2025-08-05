// ===== src/components/match/LiveOddsWidget.tsx =====
import "server-only"; // Ensures this component only ever runs on the server
import axios from "axios";
import LiveOddsClient from "./LiveOddsClient"; // Import the new Client Component

interface LiveOddsWidgetProps {
  fixtureId: string;
}

// Server-side data fetching function
const fetchInitialLiveOdds = async (fixtureId: string) => {
  try {
    // We use the full URL here because this is a server-to-server fetch
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_PUBLIC_APP_URL}/api/live-odds-by-fixture?fixture=${fixtureId}`
    );
    return data;
  } catch (error) {
    console.error(
      `[LiveOddsWidget] Failed to fetch initial odds for fixture ${fixtureId}:`,
      error
    );
    return null; // Return null on failure to prevent page crashes
  }
};

// This is now an async Server Component
export default async function LiveOddsWidget({
  fixtureId,
}: LiveOddsWidgetProps) {
  // 1. Fetch the initial data on the server.
  const initialOdds = await fetchInitialLiveOdds(fixtureId);

  // If there are no initial odds, we don't need to render the client component at all.
  if (!initialOdds) {
    return null;
  }

  // 2. Render the Client Component and pass the server-fetched data as a prop.
  return <LiveOddsClient initialOdds={initialOdds} fixtureId={fixtureId} />;
}
