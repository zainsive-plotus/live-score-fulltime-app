// ===== socket-server.ts (UPDATED) =====

import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import axios from "axios";
import url from "url";

const PORT = process.env.PORT || 3001;
const POLLING_INTERVAL = 15000; // 15 seconds for a more responsive feel

const server = http.createServer();
const wss = new WebSocketServer({ server });

const subscriptions = new Map<string, Set<WebSocket>>();
const lastKnownData = new Map<string, any>();

const apiRequest = async (endpoint: string, params: object) => {
  const options = {
    method: "GET",
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/${endpoint}`,
    params,
    headers: { "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY },
  };
  try {
    const response = await axios.request(options);
    return response.data.response;
  } catch (error) {
    console.error(
      `[WebSocket Server] API request to ${endpoint} failed:`,
      error
    );
    return [];
  }
};

// --- MODIFIED POLLING LOGIC ---
const pollApiForUpdates = async () => {
  if (subscriptions.size === 0) return;

  const fixtureIds = Array.from(subscriptions.keys());
  console.log(
    `[WebSocket Server] Polling for ${fixtureIds.length} live fixtures...`
  );

  const fixturesData = await apiRequest("fixtures", {
    ids: fixtureIds.join("-"),
  });

  for (const fixture of fixturesData) {
    const fixtureId = fixture.fixture.id.toString();

    // Fetch events and stats alongside the fixture data
    const [events, statistics] = await Promise.all([
      apiRequest("fixtures/events", { fixture: fixtureId }),
      apiRequest("fixtures/statistics", { fixture: fixtureId }),
    ]);

    const comprehensiveUpdate = {
      fixtureData: fixture,
      events: events || [],
      statistics: statistics || [],
    };

    const lastData = lastKnownData.get(fixtureId);

    // Compare the new comprehensive payload to the last known one
    if (JSON.stringify(lastData) !== JSON.stringify(comprehensiveUpdate)) {
      lastKnownData.set(fixtureId, comprehensiveUpdate);
      const subscribedClients = subscriptions.get(fixtureId);
      if (subscribedClients) {
        console.log(
          `[WebSocket Server] Broadcasting update for fixture ${fixtureId} to ${subscribedClients.size} clients.`
        );
        subscribedClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "LIVE_UPDATE",
                payload: comprehensiveUpdate,
              })
            );
          }
        });
      }
    }
  }
};

setInterval(pollApiForUpdates, POLLING_INTERVAL);

wss.on("connection", (ws, req) => {
  const parameters = new URLSearchParams(url.parse(req.url!).search!);
  const fixtureId = parameters.get("fixtureId");

  if (!fixtureId) {
    ws.close(1008, "Fixture ID is required");
    return;
  }

  if (!subscriptions.has(fixtureId)) {
    subscriptions.set(fixtureId, new Set());
  }
  subscriptions.get(fixtureId)!.add(ws);

  console.log(
    `[WebSocket Server] Client connected for fixture ${fixtureId}. Total clients for this match: ${
      subscriptions.get(fixtureId)!.size
    }`
  );

  ws.on("close", () => {
    const clientSet = subscriptions.get(fixtureId);
    if (clientSet) {
      clientSet.delete(ws);
      if (clientSet.size === 0) {
        subscriptions.delete(fixtureId);
        lastKnownData.delete(fixtureId);
        console.log(
          `[WebSocket Server] Last client disconnected for fixture ${fixtureId}. Unsubscribing.`
        );
      }
    }
  });

  ws.on("error", console.error);
});

server.listen(PORT, () => {
  console.log(
    `[WebSocket Server] Live update server listening on port ${PORT}`
  );
});
