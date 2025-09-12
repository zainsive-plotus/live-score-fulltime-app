// ===== src/components/team/TeamTransfersTab.tsx =====

"use client";

import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";
import type { CleanedTransfer } from "@/lib/data/transfers";
import StyledLink from "../StyledLink";
import { generateTeamSlug } from "@/lib/generate-team-slug";

interface TeamTransfersTabProps {
  transfers: CleanedTransfer[] | null;
  currentTeam: { id: number; name: string; logo: string };
}

const TransferRow = ({
  transfer,
  currentTeam,
}: {
  transfer: CleanedTransfer;
  currentTeam: { id: number; name: string; logo: string };
}) => {
  const { t } = useTranslation();
  const isArrival = transfer.teamIn.id === currentTeam.id;
  const otherTeam = isArrival ? transfer.teamOut : transfer.teamIn;

  const fromTeam = isArrival ? otherTeam : currentTeam;
  const toTeam = isArrival ? currentTeam : otherTeam;

  const fromTeamName = isArrival ? otherTeam.name : currentTeam.name;
  const toTeamName = isArrival ? currentTeam.name : otherTeam.name;

  return (
    <div className="flex items-center gap-4 p-3 bg-brand-dark/50 rounded-lg border-b border-gray-700/50">
      <div className="flex items-center gap-3 flex-grow min-w-0 w-2/5">
        <Image
          src={proxyImageUrl(transfer.playerPhoto)}
          alt={transfer.playerName}
          width={48}
          height={48}
          className="rounded-full bg-gray-700 object-cover"
        />
        <div className="min-w-0">
          <p className="font-bold text-white truncate text-sm">
            {transfer.playerName}
          </p>
          <p className="text-xs text-brand-muted">
            {format(new Date(transfer.date), "dd MMM yyyy")}
          </p>
        </div>
      </div>

      <div className="w-3/5 flex items-center justify-end gap-2">
        <StyledLink
          href={generateTeamSlug(fromTeam.name, fromTeam.id)}
          className="flex items-center gap-2 text-right hover:opacity-80 transition-opacity min-w-0"
        >
          <span className="font-semibold text-xs text-brand-light truncate hidden sm:block">
            {fromTeamName}
          </span>
          <Image
            src={proxyImageUrl(fromTeam.logo)}
            alt={fromTeam.name}
            width={28}
            height={28}
            className="rounded-full bg-gray-800"
          />
        </StyledLink>

        <ArrowRight
          size={20}
          className={isArrival ? "text-green-400" : "text-red-400"}
        />

        <StyledLink
          href={generateTeamSlug(toTeam.name, toTeam.id)}
          className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity min-w-0"
        >
          <Image
            src={proxyImageUrl(toTeam.logo)}
            alt={toTeam.name}
            width={28}
            height={28}
            className="rounded-full bg-gray-800"
          />
          <span className="font-semibold text-xs text-brand-light truncate hidden sm:block">
            {toTeamName}
          </span>
        </StyledLink>
      </div>
    </div>
  );
};

export default function TeamTransfersTab({
  transfers,
  currentTeam,
}: TeamTransfersTabProps) {
  const { t } = useTranslation();

  if (!transfers) {
    return (
      <div className="p-8 text-center text-red-400 bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("error_loading_transfers")}</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="p-8 text-center text-brand-muted bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("no_transfers_found")}</p>
      </div>
    );
  }

  const arrivals = transfers.filter((t) => t.teamIn.id === currentTeam.id);
  const departures = transfers.filter((t) => t.teamOut.id === currentTeam.id);

  return (
    <div className="bg-brand-secondary rounded-xl p-4">
      {/* --- CORE CHANGE: Main grid container for the two-column layout --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Arrivals Column */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <ArrowRight className="text-green-400 bg-green-500/10 p-1.5 rounded-full w-8 h-8" />
            {t("arrivals")}
            <span className="text-base font-semibold text-brand-muted">
              ({arrivals.length})
            </span>
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {arrivals.length > 0 ? (
              arrivals.map((t) => (
                <TransferRow
                  key={`${t.playerId}-${t.date}-in`}
                  transfer={t}
                  currentTeam={currentTeam}
                />
              ))
            ) : (
              <p className="text-sm text-brand-muted p-4 text-center">
                {t("no_recent_arrivals")}
              </p>
            )}
          </div>
        </div>

        {/* Departures Column */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <ArrowLeft className="text-red-400 bg-red-500/10 p-1.5 rounded-full w-8 h-8" />
            {t("departures")}
            <span className="text-base font-semibold text-brand-muted">
              ({departures.length})
            </span>
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {departures.length > 0 ? (
              departures.map((t) => (
                <TransferRow
                  key={`${t.playerId}-${t.date}-out`}
                  transfer={t}
                  currentTeam={currentTeam}
                />
              ))
            ) : (
              <p className="text-sm text-brand-muted p-4 text-center">
                {t("no_recent_departures")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
