// ===== src/components/PredictionSidebarWidget.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { Info, Sparkles, ArrowRight, TrendingUp } from "lucide-react"; // CHANGE: Imported ArrowRight
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "./StyledLink";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { useMemo } from "react";

interface Prediction {
  fixture: any;
  teams: { home: any; away: any };
  league: { name: string; logo: string };
  prediction: { home: number; draw: number; away: number };
}

const fetchSidebarPredictions = async (
  limit: number
): Promise<Prediction[]> => {
  const { data } = await axios.get(
    `/api/predictions/upcoming?page=1&limit=${limit}`
  );
  return data.fixtures || [];
};

const PredictionRow = ({ prediction }: { prediction: Prediction }) => {
  const { t } = useTranslation();
  const { teams, prediction: preds, fixture, league } = prediction;
  const matchSlug = generateMatchSlug(teams.home, teams.away, fixture.id);

  const { predictedOutcomeText, confidence, predictedTeam } = useMemo(() => {
    const maxConfidence = Math.max(preds.home, preds.draw, preds.away);
    let outcome = t("draw_prediction");
    let team = null;

    if (maxConfidence === preds.home) {
      outcome = t("win_prediction", { teamName: teams.home.name });
      team = teams.home;
    } else if (maxConfidence === preds.away) {
      outcome = t("win_prediction", { teamName: teams.away.name });
      team = teams.away;
    }

    return {
      predictedOutcomeText: outcome,
      confidence: maxConfidence,
      predictedTeam: team,
    };
  }, [preds, teams, t]);

  return (
    <StyledLink
      href={matchSlug}
      className="block p-3 rounded-lg hover:bg-brand-dark transition-colors group"
    >
      {/* League Info */}
      <div className="flex items-center gap-2 mb-2">
        <Image
          src={proxyImageUrl(league.logo)}
          alt={league.name}
          width={16}
          height={16}
        />
        <span className="text-xs text-text-muted font-semibold truncate">
          {league.name}
        </span>
      </div>

      {/* Matchup */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 w-2/5 truncate">
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
        <span className="text-xs font-mono text-text-muted">VS</span>
        <div className="flex items-center gap-2 w-2/5 justify-end truncate">
          <span className="font-bold text-sm text-white truncate text-right">
            {teams.away.name}
          </span>
          <Image
            src={proxyImageUrl(teams.away.logo)}
            alt={teams.away.name}
            width={24}
            height={24}
          />
        </div>
      </div>

      {/* Prediction Bar */}
      <div className="mt-2 flex w-full h-1.5 rounded-full overflow-hidden bg-gray-700/50">
        <div className="bg-green-500" style={{ width: `${preds.home}%` }}></div>
        <div className="bg-amber-500" style={{ width: `${preds.draw}%` }}></div>
        <div className="bg-blue-500" style={{ width: `${preds.away}%` }}></div>
      </div>

      {/* Prediction Text */}
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-center p-2 rounded-md bg-brand-dark/30 group-hover:bg-[var(--brand-accent)]/10 transition-colors">
        <Sparkles size={14} className="text-[var(--brand-accent)]" />
        <p className="text-text-secondary">
          {predictedOutcomeText}
          <span className="font-bold text-white"> ({confidence}%)</span>
        </p>
      </div>
    </StyledLink>
  );
};

const WidgetSkeleton = () => (
  <div className="bg-brand-secondary rounded-lg shadow-lg animate-pulse">
    <div className="p-4 border-b border-gray-700/50">
      <div className="h-6 w-3/4 bg-gray-700 rounded"></div>
    </div>
    <div className="p-2 space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-3 space-y-2">
          <div className="h-4 w-1/2 bg-gray-600 rounded"></div>
          <div className="flex justify-between items-center">
            <div className="h-5 w-2/5 bg-gray-600 rounded"></div>
            <div className="h-5 w-2/5 bg-gray-600 rounded"></div>
          </div>
          <div className="h-2 w-full bg-gray-700 rounded-full"></div>
          <div className="h-8 w-full bg-gray-700/50 rounded-md"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function PredictionSidebarWidget() {
  const { t } = useTranslation();

  const {
    data: predictions,
    isLoading,
    isError,
  } = useQuery<Prediction[]>({
    queryKey: ["sidebarPredictions"],
    queryFn: () => fetchSidebarPredictions(4),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  if (isLoading) {
    return <WidgetSkeleton />;
  }

  if (isError || !predictions || predictions.length === 0) {
    return (
      <div className="bg-brand-secondary rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-[var(--brand-accent)]" />
            {t("upcoming_predictions")}
          </h3>
        </div>
        <div className="p-6 text-center text-brand-muted">
          <Info size={28} className="mx-auto mb-2" />
          <p className="text-sm">{t("no_upcoming_predictions")}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-brand-secondary rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-[var(--brand-accent)]" />
          {t("upcoming_predictions")}
        </h3>
      </div>

      <div className="p-2 space-y-1">
        {predictions.map((p) => (
          <PredictionRow key={p.fixture.id} prediction={p} />
        ))}
      </div>

      {/* ADD: View More Button */}
      <div className="p-2 border-t border-gray-700/50">
        <StyledLink
          href="/predictions"
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-brand-muted hover:text-white hover:bg-brand-dark py-2 rounded-lg transition-colors"
        >
          {t("view_more_predictions")}
          <ArrowRight size={16} />
        </StyledLink>
      </div>
    </section>
  );
}
