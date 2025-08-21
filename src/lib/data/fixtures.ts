// ===== src/lib/data/fixtures.ts =====

import "server-only";
import axios from "axios";
import { format, addDays, eachDayOfInterval } from "date-fns";

const axiosOptions = (params: object) => ({
  method: "GET",
  url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/fixtures`,
  params,
  headers: {
    "x-apisports-key": process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
  },
});

export async function getFixturesByDateRange(from: string, to: string) {
  try {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const interval = eachDayOfInterval({ start: startDate, end: endDate });
    const dateStrings = interval.map((day) => format(day, "yyyy-MM-dd"));

    const fixturePromises = dateStrings.map((d) =>
      axios.request(axiosOptions({ date: d }))
    );

    const responses = await Promise.allSettled(fixturePromises);

    const allFixtures = responses
      .filter(
        (result) => result.status === "fulfilled" && result.value.data.response
      )
      .flatMap(
        (result) => (result as PromiseFulfilledResult<any>).value.data.response
      );

    const uniqueFixtures = Array.from(
      new Map(allFixtures.map((m) => [m.fixture.id, m])).values()
    );

    return uniqueFixtures;
  } catch (error) {
    console.error(
      "[data/fixtures] Failed to fetch fixtures by date range:",
      error
    );
    return [];
  }
}
