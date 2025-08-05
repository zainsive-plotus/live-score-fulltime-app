// ===== src/components/league-detail-view/LeagueHeader.tsx =====
import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Shield, Flag, Calendar } from "lucide-react";

interface LeagueHeaderProps {
  league: {
    name: string;
    logo: string;
    type: string;
  };
  country: {
    name: string;
    flag: string | null;
  };
  currentSeason: number;
}

export default function LeagueHeader({
  league,
  country,
  currentSeason,
}: LeagueHeaderProps) {
  return (
    <div className="relative bg-brand-secondary rounded-lg overflow-hidden p-6 pt-10 text-center md:text-left">
      {/* Background Flag */}
      {country.flag && (
        <Image
          src={proxyImageUrl(country.flag)}
          alt={`${country.name} flag`}
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-5"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary via-brand-secondary/80 to-transparent z-10"></div>

      <div className="relative z-20 flex flex-col md:flex-row items-center gap-6">
        {/* League Logo */}
        <div className="flex-shrink-0">
          <Image
            src={proxyImageUrl(league.logo)}
            alt={league.name}
            width={96}
            height={96}
            className="bg-white/90 rounded-full p-2 shadow-lg"
          />
        </div>

        {/* League Info */}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white">
            {league.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-3 text-brand-muted">
            <div className="flex items-center gap-1.5 text-sm">
              <Shield size={14} />
              <span>{league.type}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Flag size={14} />
              <span>{country.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar size={14} />
              <span>
                {currentSeason}/{currentSeason + 1}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
