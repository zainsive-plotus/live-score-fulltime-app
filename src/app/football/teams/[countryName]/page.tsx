import type { Metadata } from "next";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getI18n } from "@/lib/i18n/server";
import TeamsByCountryClient from "@/components/TeamsByCountryClient"; // <-- Import new client component

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
    console.error(`Failed to fetch ${endpoint}:`, error);
    return [];
  }
};

const fetchTeamsByCountry = async (countryName: string) => {
  const season = new Date().getFullYear();
  const leagues = await apiRequest("leagues", { country: countryName });
  if (!leagues || leagues.length === 0) {
    return [];
  }

  const leagueIds = leagues.map((l: any) => l.league.id);
  const teamPromises = leagueIds.map((id: any) =>
    apiRequest("teams", { league: id, season: season })
  );
  const responses = await Promise.allSettled(teamPromises);

  const allTeamsResponses = responses
    .filter((result) => result.status === "fulfilled" && result.value)
    .flatMap((result) => (result as PromiseFulfilledResult<any>).value);

  const uniqueTeams = Array.from(
    new Map(allTeamsResponses.map((item) => [item.team.id, item])).values()
  );

  uniqueTeams.sort((a, b) => a.team.name.localeCompare(b.team.name));
  return uniqueTeams;
};

export async function generateMetadata({
  params,
}: {
  params: { countryName: string };
}): Promise<Metadata> {
  const countryName = decodeURIComponent(params.countryName);
  const t = await getI18n();
  return {
    title: t("teams_in_country_page_title", { country: countryName }),
    description: t("teams_in_country_page_description", {
      country: countryName,
    }),
  };
}

export default async function TeamsByCountryPage({
  params,
}: {
  params: { countryName: string };
}) {
  const countryName = decodeURIComponent(params.countryName);
  const t = await getI18n();
  const allTeams = await fetchTeamsByCountry(countryName);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-1 w-full lg:grid lg:grid-cols-[288px_1fr] lg:gap-8 lg:items-start">
        <Sidebar />
        <main className="min-w-0 p-4 lg:p-0 lg:py-6">
          <h1 className="text-4xl font-extrabold text-white mb-6">
            {t("teams_in_country_title", { country: countryName })}
          </h1>

          <TeamsByCountryClient initialTeams={allTeams} />
        </main>
      </div>
    </div>
  );
}
