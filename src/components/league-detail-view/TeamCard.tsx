import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import StyledLink from "@/components/StyledLink";
import { generateTeamSlug } from "@/lib/generate-team-slug";
import { Users, MapPin, Calendar } from "lucide-react"; // <-- Import Calendar
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface TeamCardProps {
  team: any;
  venue: any;
  rank?: number;
  countryName?: string;
  countryFlag?: string;
  squadSize?: number;
  rankDescription?: string;
}

const getRankClasses = (
  description: string | null
): { border: string; text: string } => {
  if (!description)
    return { border: "border-gray-700/50", text: "text-brand-muted" };
  const desc = description.toLowerCase();
  if (desc.includes("champions league") || desc.includes("promotion"))
    return { border: "border-green-500", text: "text-green-400" };
  if (desc.includes("europa league") || desc.includes("qualification"))
    return { border: "border-orange-500", text: "text-orange-400" };
  if (desc.includes("conference league") || desc.includes("play-off"))
    return { border: "border-sky-400", text: "text-sky-300" };
  if (desc.includes("relegation"))
    return { border: "border-red-600", text: "text-red-500" };
  return { border: "border-gray-700/50", text: "text-brand-muted" };
};

export function TeamCardSkeleton() {
  return (
    <div className="bg-brand-secondary rounded-lg flex flex-col h-full animate-pulse">
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-700"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-600 rounded"></div>
          <div className="h-3 w-1/2 bg-gray-600/50 rounded"></div>
        </div>
      </div>
      <div className="px-4 pb-4 mt-auto space-y-2 border-t border-gray-700/50 pt-3">
        <div className="h-3 w-full bg-gray-600/50 rounded"></div>
        <div className="h-3 w-2/3 bg-gray-600/50 rounded"></div>
      </div>
    </div>
  );
}

export default function TeamCard({
  team,
  venue,
  rank,
  countryName,
  countryFlag,
  squadSize,
  rankDescription,
}: TeamCardProps) {
  const rankClasses = getRankClasses(rankDescription || null);
  const { t } = useTranslation(); // <-- Use hook

  return (
    <StyledLink
      href={generateTeamSlug(team.name, team.id)}
      className="block group h-full"
    >
      <div
        className={`bg-brand-secondary rounded-lg flex flex-col h-full border-l-4 ${rankClasses.border} transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20`}
      >
        <div className="p-4 flex items-start gap-4">
          <Image
            src={proxyImageUrl(team.logo)}
            alt={team.name}
            width={40}
            height={40}
            className="flex-shrink-0 mt-1"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white truncate group-hover:text-brand-purple transition-colors">
              {team.name}
            </h4>
            {countryName && countryFlag && (
              <div className="flex items-center gap-1.5 text-xs text-brand-muted mt-1">
                <Image
                  src={countryFlag}
                  alt={countryName}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                <span>{countryName}</span>
              </div>
            )}
          </div>
          {rank && (
            <div className={`text-2xl font-black ${rankClasses.text}`}>
              {rank}
            </div>
          )}
        </div>

        <div className="px-4 pb-4 mt-auto space-y-1.5 border-t border-gray-700/50 pt-3">
          {squadSize && (
            <div className="flex items-center gap-2 text-xs text-brand-muted">
              <Users className="w-3 h-3" />
              <span>
                {t("squad_size")}: {squadSize}
              </span>
            </div>
          )}
          {team.founded && ( // <-- Added new translated item here
            <div className="flex items-center gap-2 text-xs text-brand-muted">
              <Calendar size={12} />
              <span>{t("founded_in", { year: team.founded })}</span>
            </div>
          )}
          {venue?.name && (
            <div className="flex items-center gap-2 text-xs text-brand-muted truncate">
              <MapPin className="w-3 h-3" />
              <span>{venue.name}</span>
            </div>
          )}
        </div>
      </div>
    </StyledLink>
  );
}
