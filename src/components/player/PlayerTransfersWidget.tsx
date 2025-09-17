// ===== src/components/player/PlayerTransfersWidget.tsx =====
// (This is the same as the TeamTransfersTab, but adapted for a single player)
"use client";

import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Info, Repeat } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "../StyledLink";
import { generateTeamSlug } from "@/lib/generate-team-slug";

const TransferRow = ({ transfer }: { transfer: any }) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-brand-dark/50 rounded-lg">
      <span className="font-semibold text-sm text-brand-muted w-24">
        {format(new Date(transfer.date), "dd MMM yyyy")}
      </span>
      <div className="flex items-center gap-2">
        <Image
          src={proxyImageUrl(transfer.teams.out.logo)}
          alt={transfer.teams.out.name}
          width={24}
          height={24}
        />
        <span className="font-semibold text-xs text-brand-light truncate">
          {transfer.teams.out.name}
        </span>
      </div>
      <ArrowRight size={16} className="text-brand-purple flex-shrink-0" />
      <div className="flex items-center gap-2">
        <Image
          src={proxyImageUrl(transfer.teams.in.logo)}
          alt={transfer.teams.in.name}
          width={24}
          height={24}
        />
        <span className="font-semibold text-xs text-brand-light truncate">
          {transfer.teams.in.name}
        </span>
      </div>
      <span className="ml-auto text-xs text-brand-muted capitalize">
        {transfer.type}
      </span>
    </div>
  );
};

export default function PlayerTransfersWidget({
  transfers,
}: {
  transfers: any[];
}) {
  const { t } = useTranslation();

  if (!transfers || transfers.length === 0) {
    return (
      <div className="p-8 text-center text-brand-muted bg-brand-secondary rounded-lg">
        <Info size={32} className="mx-auto mb-3" />
        <p className="font-semibold">{t("no_transfers_found")}</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary rounded-xl p-4">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <Repeat size={22} /> Transfer History
      </h2>
      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
        {transfers[0].transfers.map((t: any, index: number) => (
          <TransferRow key={index} transfer={t} />
        ))}
      </div>
    </div>
  );
}
