// ===== src/components/DesktopMatchListItem.tsx =====

"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "@/components/StyledLink";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  History,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { generateMatchSlug } from "@/lib/generate-match-slug";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation";
import ZonedDate from "./ZonedDate";

type Odds = { home: string; draw: string; away: string } | undefined | null;

const fetchFanskorOdds = async (fixtureId: number): Promise<Odds | null> => {
  try {
    const { data } = await axios.post("/api/batch-predictions", {
      fixtureIds: [fixtureId],
    });
    return data[fixtureId] || null;
  } catch (error) {
    console.error(
      `Failed to fetch Fanskor odds for fixture ${fixtureId}`,
      error
    );
    return null;
  }
};

interface DesktopMatchListItemProps {
  match: any;
  isLive: boolean;
}

export default function DesktopMatchListItem({
  match,
  isLive,
}: DesktopMatchListItemProps) {
  const { fixture, teams, goals, league } = match;
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(fixture.status.elapsed);

  const queryParams = new URLSearchParams({
    home: teams.home.name,
    away: teams.away.name,
    league: league.name,
  }).toString();

  const slug = generateMatchSlug(teams.home, teams.away, fixture.id);
  const hrefWithParams = `${slug}?${queryParams}`;

  // MODIFIED: The useEffect hook now depends on the `match` object itself.
  // When the parent's useQuery refetches, it creates a new `match` object.
  // This new object reference triggers the effect, even if the `elapsed` value inside is the same.
  // This is the key to re-synchronizing the timer.
  useEffect(() => {
    // 1. Always reset the displayed time to the latest data from the API
    setElapsedTime(match.fixture.status.elapsed);

    // 2. Start a new timer only if the match is live and not at halftime/finished
    if (
      isLive &&
      !["FT", "AET", "PEN", "HT"].includes(match.fixture.status.short)
    ) {
      const interval = setInterval(() => {
        setElapsedTime((prevTime) => (prevTime ? prevTime + 1 : 1));
      }, 60000); // Increment every minute

      // 3. The cleanup function will run every time the effect is re-triggered,
      //    clearing the old timer before starting a new one.
      return () => clearInterval(interval);
    }
  }, [match, isLive]); // The dependency array is the crucial fix

  const isFinished = ["FT", "AET", "PEN"].includes(fixture.status.short);
  const [showResult, setShowResult] = useState(false);

  const { data: customOdds, isLoading } = useQuery({
    queryKey: ["customOdds", fixture.id],
    queryFn: () => fetchFanskorOdds(fixture.id),
    enabled: showResult,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { predictedOutcome, lowestOddValue } = useMemo(() => {
    if (!customOdds) return { predictedOutcome: null, lowestOddValue: null };
    const odds = {
      home: parseFloat(customOdds.home || "999"),
      draw: parseFloat(customOdds.draw || "999"),
      away: parseFloat(customOdds.away || "999"),
    };
    const minOdd = Math.min(odds.home, odds.draw, odds.away);
    if (minOdd === odds.home)
      return { predictedOutcome: "Home", lowestOddValue: customOdds.home };
    if (minOdd === odds.away)
      return { predictedOutcome: "Away", lowestOddValue: customOdds.away };
    return { predictedOutcome: "Draw", lowestOddValue: customOdds.draw };
  }, [customOdds]);

  const actualResult = useMemo(() => {
    if (!isFinished) return null;
    if (teams.home.winner) return "Home";
    if (teams.away.winner) return "Away";
    return "Draw";
  }, [isFinished, teams]);

  const wasPredictionCorrect = predictedOutcome === actualResult;

  const CustomOddBox = ({
    value,
    label,
    isFavorite,
  }: {
    value: string | undefined;
    label: string;
    isFavorite: boolean;
  }) => {
    const favoriteStyles = {
      background: "linear-gradient(to bottom right, #ED5C19, #c54c14)",
      color: "#FFFFFF",
      boxShadow: "0 4px 15px -5px rgba(237, 92, 25, 0.4)",
    };
    const defaultStyles = {
      backgroundColor: "#1F1D2B",
      color: "#E0E0E0",
    };
    return (
      <div
        className="flex flex-col items-center justify-center p-1 rounded-md w-16 h-12 transition-all duration-300"
        style={isFavorite ? favoriteStyles : defaultStyles}
      >
        <span
          className="text-xs font-semibold"
          style={{
            opacity: isFavorite ? 0.8 : 1,
            color: isFavorite ? "#FFFFFF" : "#9E9E9E",
          }}
        >
          {label}
        </span>
        <span className="text-base font-black">{value || "-"}</span>
      </div>
    );
  };

  return (
    <div
      className="group flex items-center p-2 rounded-lg transition-all duration-300 ease-in-out border border-transparent hover:border-[#8b5cf6]/20"
      style={{ backgroundColor: "#363636ff" }}
    >
      <Link href={hrefWithParams} className="flex flex-1 items-center min-w-0">
        <div className="w-16 flex-shrink-0 text-center text-sm font-semibold">
          {isLive ? (
            <div
              className="flex items-center justify-center gap-1.5"
              style={{ color: "#4ade80" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              ></span>
              <span>{elapsedTime}'</span>
            </div>
          ) : isFinished ? (
            <div style={{ color: "#9E9E9E" }}>{t("ft_short")}</div>
          ) : (
            <div style={{ color: "#FFFFFF" }}>
              <ZonedDate date={fixture.date} format="HH:mm" />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1.5 pr-4">
          <div className="flex items-center gap-3">
            <Image
              src={proxyImageUrl(teams.home.logo)}
              alt={teams.home.name}
              width={20}
              height={20}
              unoptimized={true}
            />
            <span
              className="font-semibold text-base"
              style={{ color: "#FFFFFF" }}
            >
              {teams.home.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Image
              src={proxyImageUrl(teams.away.logo)}
              alt={teams.away.name}
              width={20}
              height={20}
              unoptimized={true}
            />
            <span
              className="font-semibold text-base"
              style={{ color: "#FFFFFF" }}
            >
              {teams.away.name}
            </span>
          </div>
        </div>
        <div
          className="w-10 flex-shrink-0 flex flex-col items-center gap-1.5 text-base font-bold"
          style={{ color: isLive ? "#4ade80" : "#FFFFFF" }}
        >
          <span>{goals.home ?? "-"}</span>
          <span>{goals.away ?? "-"}</span>
        </div>
      </Link>

      <div
        className="w-64 flex-shrink-0 flex items-center justify-end gap-4 pl-4 border-l"
        style={{ borderColor: "rgba(55, 65, 81, 0.5)" }}
      >
        <div className="flex-1 text-center">
          {isFinished ? (
            !showResult ? (
              <button
                onClick={() => setShowResult(true)}
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold border rounded-md p-2.5 transition-all duration-200"
                style={{
                  backgroundColor: "#1F1D2B",
                  borderColor: "rgba(158, 158, 158, 0.2)",
                  color: "#9E9E9E",
                }}
              >
                <History size={16} /> {t("see_prediction_result")}
              </button>
            ) : isLoading ? (
              <div
                className="flex justify-center items-center gap-2 text-sm font-semibold p-2.5"
                style={{ color: "#9E9E9E" }}
              >
                <Loader2 size={16} className="animate-spin" />{" "}
                {t("loading_result")}
              </div>
            ) : customOdds ? (
              <div
                className="flex items-center justify-center gap-2 p-2.5 rounded-md text-sm font-bold"
                style={{
                  backgroundColor: wasPredictionCorrect
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(55, 65, 81, 0.5)",
                  color: wasPredictionCorrect ? "#4ade80" : "#9E9E9E",
                }}
              >
                {wasPredictionCorrect ? (
                  <CheckCircle size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                <span>
                  {t("predicted_result", {
                    outcome: predictedOutcome,
                    odds: lowestOddValue,
                  })}
                </span>
              </div>
            ) : (
              <span
                className="text-xs font-semibold"
                style={{ color: "#9E9E9E" }}
              >
                {t("prediction_data_unavailable")}
              </span>
            )
          ) : !showResult ? (
            <button
              onClick={() => setShowResult(true)}
              className="flex items-center justify-center gap-2 w-full text-sm font-semibold border rounded-md p-2.5 transition-all duration-200"
              style={{
                backgroundColor: "rgba(237, 92, 25, 0.1)",
                borderColor: "rgba(237, 92, 25, 0.5)",
                color: "#ED5C19",
              }}
            >
              <TrendingUp size={16} />
              {t("show_odds")}
            </button>
          ) : isLoading ? (
            <div
              className="flex justify-center items-center gap-2 text-sm font-semibold p-2.5"
              style={{ color: "#9E9E9E" }}
            >
              <Loader2 size={16} className="animate-spin" />{" "}
              {t("calculating_odds")}
            </div>
          ) : customOdds ? (
            <div className="flex items-center justify-around gap-1">
              <CustomOddBox
                value={customOdds.home}
                label={t("odd_label_home")}
                isFavorite={predictedOutcome === "Home"}
              />
              <CustomOddBox
                value={customOdds.draw}
                label={t("odd_label_draw")}
                isFavorite={predictedOutcome === "Draw"}
              />
              <CustomOddBox
                value={customOdds.away}
                label={t("odd_label_away")}
                isFavorite={predictedOutcome === "Away"}
              />
            </div>
          ) : (
            <span
              className="text-xs font-semibold"
              style={{ color: "#9E9E9E" }}
            >
              {t("odds_unavailable")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const MatchListItemSkeleton = () => (
  <div
    className="flex items-center p-2 rounded-lg animate-pulse"
    style={{ backgroundColor: "#363636ff" }}
  >
    <div className="flex-1 flex items-center">
      <div className="w-16 flex-shrink-0">
        <div
          className="h-5 w-10 mx-auto rounded"
          style={{ backgroundColor: "#1F1D2B" }}
        ></div>
      </div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3 w-4/5">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: "#1F1D2B" }}
          ></div>
          <div
            className="h-5 w-full rounded"
            style={{ backgroundColor: "#1F1D2B" }}
          ></div>
        </div>
        <div className="flex items-center gap-3 w-4/5">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: "#1F1D2B" }}
          ></div>
          <div
            className="h-5 w-full rounded"
            style={{ backgroundColor: "#1F1D2B" }}
          ></div>
        </div>
      </div>
      <div className="w-10 flex-shrink-0 flex flex-col items-center gap-3">
        <div
          className="h-5 w-4 rounded"
          style={{ backgroundColor: "#1F1D2B" }}
        ></div>
        <div
          className="h-5 w-4 rounded"
          style={{ backgroundColor: "#1F1D2B" }}
        ></div>
      </div>
    </div>
    <div
      className="w-64 flex-shrink-0 pl-4 border-l flex items-center justify-end gap-4"
      style={{ borderColor: "rgba(55, 65, 81, 0.5)" }}
    >
      <div
        className="w-full h-11 rounded-md"
        style={{ backgroundColor: "#1F1D2B" }}
      ></div>
      <div
        className="w-6 h-6 rounded-full"
        style={{ backgroundColor: "#1F1D2B" }}
      ></div>
    </div>
  </div>
);
