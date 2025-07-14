"use client"; // <-- This needs to be a client component to use the hook

import { MapPin, Users } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-gray-700/50 last:border-b-0">
    <div className="flex items-center gap-2 text-brand-muted">
      <Icon size={14} />
      <span>{label}</span>
    </div>
    <span className="font-semibold text-white text-right">{value}</span>
  </div>
);

export default function TeamInfoWidget({ venue }: { venue: any }) {
  const { t } = useTranslation(); // <-- Use hook

  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-2">
        {t("venue_information")}
      </h3>
      <div className="space-y-1">
        <InfoRow
          icon={MapPin}
          label={t("stadium")}
          value={venue.name || t("not_available_short")}
        />
        <InfoRow
          icon={MapPin}
          label={t("city")}
          value={venue.city || t("not_available_short")}
        />
        <InfoRow
          icon={Users}
          label={t("capacity")}
          value={venue.capacity?.toLocaleString() || t("not_available_short")}
        />
      </div>
    </div>
  );
}
