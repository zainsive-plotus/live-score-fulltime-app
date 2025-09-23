// ===== src/hooks/useLiveFixtureUpdates.ts (UPDATED) =====
"use client";

import { useState, useEffect, useRef } from "react";

const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001";

// This hook now returns the entire live match data object
export function useLiveFixtureUpdates(initialMatchData: any) {
  const [liveData, setLiveData] = useState(initialMatchData);
  const ws = useRef<WebSocket | null>(null);

  const isLive = ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(
    initialMatchData?.fixtureData?.fixture?.status?.short
  );

  useEffect(() => {
    if (!isLive || !initialMatchData?.fixtureData?.fixture?.id) {
      return;
    }

    const fixtureId = initialMatchData.fixtureData.fixture.id;
    ws.current = new WebSocket(`${WEBSOCKET_URL}?fixtureId=${fixtureId}`);

    ws.current.onopen = () =>
      console.log(`[WebSocket Client] Connected for fixture ${fixtureId}`);

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "LIVE_UPDATE" && message.payload) {
          // Update the entire state with the new comprehensive payload
          setLiveData((prevData) => ({
            ...prevData, // Keep non-live data like H2H, standings
            fixtureData: message.payload.fixtureData,
            statistics: message.payload.statistics,
            // You might want to merge events instead of replacing
            events: message.payload.events,
          }));
        }
      } catch (error) {
        console.error("[WebSocket Client] Error parsing message:", error);
      }
    };

    ws.current.onerror = (error) =>
      console.error("[WebSocket Client] WebSocket error:", error);

    return () => {
      if (ws.current) {
        ws.current.close();
        console.log(
          `[WebSocket Client] Disconnected from fixture ${fixtureId}`
        );
      }
    };
  }, [initialMatchData?.fixtureData?.fixture?.id, isLive]);

  return liveData;
}
