import Image from "next/image";
import { proxyImageUrl } from "@/lib/image-proxy";
import { Calendar } from "lucide-react";

export default function TeamHeader({
  team,
  countryFlag,
  foundedText,
}: {
  team: any;
  countryFlag: string;
  foundedText: string;
}) {
  return (
    <div className="bg-brand-secondary p-6 rounded-lg mb-8 flex flex-col md:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <Image
          src={proxyImageUrl(team.logo)}
          alt={`${team.name} logo`}
          width={96}
          height={96}
        />
        {countryFlag && (
          <Image
            src={proxyImageUrl(countryFlag)}
            alt={team.country}
            width={32}
            height={32}
            className="rounded-full absolute -bottom-2 -right-2 border-2 border-brand-secondary"
          />
        )}
      </div>
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          {team.name}
        </h1>
        {team.founded && (
          <div className="flex items-center gap-2 text-brand-muted justify-center md:justify-start mt-2">
            <Calendar size={14} />
            <span>{foundedText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
