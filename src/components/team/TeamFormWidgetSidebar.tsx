"use client";

import { useMemo } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { TrendingUp, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import StyledLink from "../StyledLink";

type FormResult = "W" | "D" | "L";

interface FormMatch {
  fixtureId: number;
  opponent: { name: string; logo: string };
  score: string;
  result: FormResult;
  date: string;
  homeTeam: any;
  awayTeam: any;
}

const FormPill = ({ result }: { result: FormResult }) => {
  const styles: Record<FormResult, string> = {
    W: "bg-green-500 text-white",
    D: "bg-gray-500 text-white",
    L: "bg-red-500 text-white",
  };
  const title = result === "W" ? "Win" : result === "D" ? "Draw" : "Loss";
  return (
    <div
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs shadow-md ${styles[result]}`}
    >
      {result}
    </div>
  );
};

const FormMatchRow = ({ match }: { match: FormMatch }) => {
  const slug = generateMatchSlug(
    match.homeTeam,
    match.awayTeam,
    match.fixtureId
  );
  const resultPillStyle = {
    W: "border-green-500",
    D: "border-gray-500",
    L: "border-red-500",
  }[match.result];

  return (
    <StyledLink href={slug} className="block group">
      <div
        className={`flex items-center gap-3 p-2 rounded-lg border-l-4 transition-all duration-200 hover:bg-white/5 ${resultPillStyle}`}
      >
        <div className="w-8 flex-shrink-0 text-center font-bold text-lg">
          <FormPill result={match.result} />
        </div>
        <Image
          src={proxyImageUrl(match.opponent.logo)}
          alt={match.opponent.name}
          width={24}
          height={24}
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-brand-purple transition-colors">
            vs {match.opponent.name}
          </p>
          <p className="text-xs text-brand-muted">
            {format(new Date(match.date), "dd MMM yyyy")}
          </p>
        </div>
        <div className="flex-shrink-0 font-bold text-sm text-white bg-brand-dark px-2 py-1 rounded-md">
          {match.score}
        </div>
      </div>
    </StyledLink>
  );
};

export default function TeamFormWidgetSidebar({
  teamId,
  fixtures,
}: {
  teamId: number;
  fixtures: any[];
}) {
  const { t } = useTranslation();

  const recentFixtures: FormMatch[] | null = useMemo(() => {
    if (!fixtures || fixtures.length === 0) return null;
    return fixtures
      .filter((m) => ["FT", "AET", "PEN"].includes(m.fixture.status.short))
      .sort((a, b) => b.fixture.timestamp - a.fixture.timestamp)
      .slice(0, 5)
      .map((match) => {
        const isHome = match.teams.home.id === teamId;
        const opponent = isHome ? match.teams.away : match.teams.home;

        let result: FormResult = "D";
        if (match.teams.home.winner) {
          result = isHome ? "W" : "L";
        } else if (match.teams.away.winner) {
          result = !isHome ? "W" : "L";
        }

        return {
          fixtureId: match.fixture.id,
          opponent: { name: opponent.name, logo: opponent.logo },
          score: `${match.goals.home} - ${match.goals.away}`,
          result,
          date: match.fixture.date,
          homeTeam: match.teams.home,
          awayTeam: match.teams.away,
        };
      });
  }, [fixtures, teamId]);

  if (!recentFixtures || recentFixtures.length === 0) {
    return (
      <div className="bg-brand-secondary p-4 rounded-lg text-center text-brand-muted text-sm">
        <Info size={20} className="mx-auto mb-2" />
        {t("no_recent_form_data")}
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp size={18} /> {t("recent_form")}
      </h3>
      <div className="space-y-2">
        {recentFixtures.map((match) => (
          <FormMatchRow key={match.fixtureId} match={match} />
        ))}
      </div>
    </div>
  );
}
