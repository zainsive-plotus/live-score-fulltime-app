"use client";

import { memo } from "react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

interface MatchStatusBannerProps {
  fixture: any;
}

const MatchStatusBanner = memo(function MatchStatusBanner({
  fixture,
}: MatchStatusBannerProps) {
  const { t } = useTranslation();
  const status = fixture.fixture.status;

  // The 'long' status (e.g., "Match Finished") is assumed to be provided by the API.
  // If these also need to be translated, a mapping from status codes to translation keys would be necessary.
  let content = <p>{status.long}</p>;
  let bgClass = "bg-gray-600";

  switch (status.short) {
    case "TBD":
    case "NS":
      content = (
        <p>
          {t("status_upcoming")} -{" "}
          {format(new Date(fixture.fixture.date), "HH:mm")}
        </p>
      );
      bgClass = "bg-blue-600";
      break;
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "P":
      content = (
        <p className="animate-pulse">
          {status.elapsed}' - {status.long}
        </p>
      );
      bgClass = "bg-red-600";
      break;
    case "FT":
    case "AET":
    case "PEN":
      content = <p>{t("status_full_time")}</p>;
      bgClass = "bg-gray-800";
      break;
  }

  return (
    <div
      className={`text-center font-bold text-white py-2 rounded-b-xl text-sm tracking-wider mb-8 ${bgClass}`}
    >
      {content}
    </div>
  );
});

export default MatchStatusBanner;
