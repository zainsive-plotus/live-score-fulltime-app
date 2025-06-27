// src/components/team/TeamInfoWidget.tsx
import { MapPin, Users } from "lucide-react";

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-gray-700/50">
    <div className="flex items-center gap-2 text-brand-muted">
      <Icon size={14} />
      <span>{label}</span>
    </div>
    <span className="font-semibold text-white text-right">{value}</span>
  </div>
);

export default function TeamInfoWidget({ venue }: { venue: any }) {
  return (
    <div className="bg-brand-secondary p-4 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-2">Venue Information</h3>
      <div className="space-y-1">
        <InfoRow icon={MapPin} label="Stadium" value={venue.name} />
        <InfoRow icon={MapPin} label="City" value={venue.city} />
        <InfoRow
          icon={Users}
          label="Capacity"
          value={venue.capacity.toLocaleString()}
        />
      </div>
    </div>
  );
}
