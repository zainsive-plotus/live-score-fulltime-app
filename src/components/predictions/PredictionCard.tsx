// ===== src/components/predictions/PredictionCard.tsx =====

"use client";

import Image from "next/image";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import StyledLink from "@/components/StyledLink";
import { proxyImageUrl } from "@/lib/image-proxy";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { useTranslation } from "@/hooks/useTranslation";
import { useMemo } from "react";

interface PredictionCardProps {
  fixture: any;
}

const FormGuideCircles = ({ formString }: { formString: string | null }) => {
  if (!formString || formString.length === 0)
    return (
      <div className="h-5 w-full flex items-center justify-end">
        <span className="text-xs text-text-muted">-</span>
      </div>
    );
  return (
    <div className="flex items-center justify-end gap-1.5">
      {formString
        .slice(-5)
        .split("")
        .map((result, index) => {
          const classes = {
            W: "bg-green-500",
            D: "bg-gray-500",
            L: "bg-red-500",
          };
          const title =
            result === "W" ? "Win" : result === "D" ? "Draw" : "Loss";
          return (
            <div
              key={index}
              title={title}
              className={`flex items-center justify-center w-5 h-5 rounded-full ${
                classes[result as keyof typeof classes]
              }`}
            >
              <span className="text-white text-[10px] font-bold">{result}</span>
            </div>
          );
        })}
    </div>
  );
};

export const PredictionCardSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg flex flex-col h-full border border-transparent animate-pulse p-3 space-y-2.5">
    <div className="flex justify-between items-center">
      <div className="h-4 w-2/3 bg-gray-700 rounded"></div>
    </div>
    <div className="h-8 w-full rounded bg-gray-600/50"></div>
    <div className="h-8 w-full rounded bg-gray-600/50"></div>
    <div className="h-2 w-full rounded-full bg-gray-700 mt-1"></div>
    <div className="h-8 w-full rounded-md bg-gray-700 mt-1"></div>
  </div>
);

export default function PredictionCard({ fixture }: PredictionCardProps) {
  const { t } = useTranslation();
  const { teams, league, prediction, h2h, form } = fixture;
  const matchSlug = generateMatchSlug(
    teams.home,
    teams.away,
    fixture.fixture.id
  );

  const highestPredictionValue = useMemo(() => {
    if (!prediction) return 0;
    return Math.max(prediction.home, prediction.draw, prediction.away);
  }, [prediction]);

  const h2hStats = useMemo(() => {
    if (!h2h || h2h.length === 0) return { home: 0, draw: 0, away: 0 };
    return h2h.slice(0, 5).reduce(
      (acc: any, match: any) => {
        if (match.teams.home.id === teams.home.id) {
          if (match.teams.home.winner) acc.home++;
          else if (match.teams.away.winner) acc.away++;
          else acc.draw++;
        } else {
          if (match.teams.home.winner) acc.away++;
          else if (match.teams.away.winner) acc.home++;
          else acc.draw++;
        }
        return acc;
      },
      { home: 0, draw: 0, away: 0 }
    );
  }, [h2h, teams]);

  const homeColor =
    prediction.home === highestPredictionValue
      ? "text-[var(--brand-accent)]"
      : "text-white";
  const awayColor =
    prediction.away === highestPredictionValue
      ? "text-[var(--brand-accent)]"
      : "text-white";
  const drawColor =
    prediction.draw === highestPredictionValue
      ? "text-[var(--brand-accent)]"
      : "text-white";

  return (
    <StyledLink
      href={matchSlug}
      className="block bg-brand-secondary rounded-xl h-full border border-gray-800/80 transition-all duration-300 hover:shadow-2xl hover:border-[var(--brand-accent)]/50 hover:-translate-y-1 group"
    >
      <div className="p-3 flex-grow flex flex-col gap-3">
        {/* League and Time Header */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src={proxyImageUrl(league.logo)}
              alt={league.name}
              width={16}
              height={16}
            />
            <p className="text-xs font-semibold text-text-muted truncate">
              {league.name}
            </p>
          </div>
          <div className="text-xs font-semibold text-brand-muted flex items-center gap-1.5 flex-shrink-0">
            <Clock size={12} />
            <span>{format(new Date(fixture.fixture.date), "HH:mm")}</span>
          </div>
        </div>

        {/* Team Rows with Form Circles */}
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr,auto] items-center gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Image
                src={proxyImageUrl(teams.home.logo)}
                alt={teams.home.name}
                width={24}
                height={24}
              />
              <span className="font-bold text-sm text-white truncate">
                {teams.home.name}
              </span>
            </div>
            <FormGuideCircles formString={form.home} />
          </div>
          <div className="grid grid-cols-[1fr,auto] items-center gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Image
                src={proxyImageUrl(teams.away.logo)}
                alt={teams.away.name}
                width={24}
                height={24}
              />
              <span className="font-bold text-sm text-white truncate">
                {teams.away.name}
              </span>
            </div>
            <FormGuideCircles formString={form.away} />
          </div>
        </div>

        {/* Prediction Section */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-center text-xs font-bold">
            <span className={`w-1/3 ${homeColor}`}>{prediction.home}%</span>
            <span className={`w-1/3 ${drawColor}`}>
              {t("draw")} {prediction.draw}%
            </span>
            <span className={`w-1/3 ${awayColor}`}>{prediction.away}%</span>
          </div>
          <div className="flex w-full h-2 rounded-full overflow-hidden bg-brand-dark/50">
            <div
              className="bg-[var(--brand-accent)]"
              style={{ width: `${prediction.home}%` }}
            ></div>
            <div
              className="bg-gray-500"
              style={{ width: `${prediction.draw}%` }}
            ></div>
            <div
              className="bg-blue-500"
              style={{ width: `${prediction.away}%` }}
            ></div>
          </div>
        </div>

        {/* H2H Footer */}
        <div className="mt-auto pt-3 border-t border-gray-700/50 text-center">
          <span className="text-xs font-semibold text-text-muted">
            H2H (W-D-L):{" "}
          </span>
          <span className="font-mono text-sm text-white font-bold tracking-wider">
            {h2hStats.home}-{h2hStats.draw}-{h2hStats.away}
          </span>
        </div>
      </div>
    </StyledLink>
  );
}
