// ===== src/components/player/PlayerProfileWidget.tsx =====
"use client";

import { useTranslation } from "@/hooks/useTranslation";
import {
  UserCircle,
  Flag,
  Calendar,
  GitCommitHorizontal,
  Maximize,
  Weight,
} from "lucide-react";
import { format } from "date-fns";

const InfoRow = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | undefined;
  icon: React.ElementType;
}) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-b-0">
      <div className="flex items-center gap-3 text-sm text-brand-muted">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <span className="font-bold text-white text-sm">{value}</span>
    </div>
  );
};

export default function PlayerProfileWidget({ player }: { player: any }) {
  const { t } = useTranslation();

  if (!player) {
    return <p>{t("player_info_unavailable")}</p>;
  }

  const birthDate = player.birth?.date
    ? format(new Date(player.birth.date), "MMMM dd, yyyy")
    : t("not_available_short");

  return (
    <div className="bg-brand-secondary rounded-xl p-4 md:p-6">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <UserCircle size={22} /> {t("player_profile")}
      </h2>
      <div className="space-y-1">
        <InfoRow label={t("full_name")} value={player.name} icon={UserCircle} />
        <InfoRow
          label={t("nationality")}
          value={player.nationality}
          icon={Flag}
        />
        <InfoRow label={t("date_of_birth")} value={birthDate} icon={Calendar} />
        <InfoRow
          label={t("age")}
          value={player.age ? `${player.age} ${t("years_old")}` : undefined}
          icon={GitCommitHorizontal}
        />
        <InfoRow label={t("height")} value={player.height} icon={Maximize} />
        <InfoRow label={t("weight")} value={player.weight} icon={Weight} />
      </div>
    </div>
  );
}
