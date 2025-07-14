"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { Crown } from "lucide-react";
import StyledLink from "./StyledLink";
import { proxyImageUrl } from "@/lib/image-proxy";
import { useTranslation } from "@/hooks/useTranslation"; // <-- Import hook

interface ICasinoPartner {
  _id: string;
  name: string;
  logoUrl: string;
  redirectUrl: string;
  description?: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
}

const fetchCasinoPartners = async (): Promise<ICasinoPartner[]> => {
  const { data } = await axios.get("/api/casino-partners");
  return data;
};

const CasinoPartnerWidget: React.FC = () => {
  const { t } = useTranslation(); // <-- Use hook
  const {
    data: partners,
    isLoading,
    isError,
  } = useQuery<ICasinoPartner[]>({
    queryKey: ["casinoPartnersPublic"],
    queryFn: fetchCasinoPartners,
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading) {
    return (
      <div className="bg-brand-secondary rounded-lg shadow-lg p-4 animate-pulse space-y-4">
        <div className="h-6 w-3/4 bg-gray-700 rounded mb-4"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-brand-secondary rounded-lg shadow-lg p-4 text-red-400">
        {t("error_loading_partners")}
      </div>
    );
  }

  if (!partners || partners.length === 0) {
    return (
      <div className="bg-brand-secondary rounded-lg shadow-lg p-4 text-brand-muted text-center">
        {t("no_active_partners")}
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <p className="text-xl font-bold text-white flex items-center gap-2">
          <Crown size={20} className="text-brand-purple" />{" "}
          {t("partner_casinos_title")}
        </p>
      </div>
      <div className="p-4 space-y-3">
        {partners.map((partner) => (
          <StyledLink
            key={partner._id}
            href={partner.redirectUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`
              block rounded-lg p-3 transition-all duration-300 transform
              ${
                partner.isFeatured
                  ? "bg-gradient-to-br from-[#ea5a1e40] to-[#ea5a1e] border border-[#ea5a1e] hover:border-[#ea5a1e] shadow-xl shadow-brand-purple/30 transform scale-[1.02] -translate-y-0.5"
                  : "bg-brand-dark/50 border border-gray-700 hover:bg-brand-dark/70"
              }
              hover:shadow-2xl hover:shadow-brand-purple/50
              flex items-center gap-3 relative overflow-hidden group
            `}
            title={partner.description || partner.name}
          >
            {partner.isFeatured && (
              <div className="absolute inset-0 bg-[#ea5a1e32] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            )}
            <div className="h-15 w-15 flex justify-center items-center">
              <Image
                src={partner.logoUrl}
                alt={`${partner.name} Logo`}
                width={60}
                height={60}
                objectFit="contain"
                unoptimized={true}
                className=" rounded-lg bg-gray-900 p-1 z-10"
              />
            </div>
            <div className="flex flex-col flex-grow truncate z-10">
              <span
                className={`font-semibold text-lg truncate
                                  ${
                                    partner.isFeatured
                                      ? "text-white"
                                      : "text-brand-light"
                                  }`}
              >
                {partner.name}
              </span>
              {partner.description && (
                <span
                  className={`text-sm text-white mt-0.5 truncate
                                      ${
                                        partner.isFeatured
                                          ? "text-white"
                                          : "text-brand-muted"
                                      }`}
                >
                  {partner.description}
                </span>
              )}
            </div>

            {partner.isFeatured && (
              <Crown size={20} className="text-yellow-400 flex-shrink-0 z-10" />
            )}
          </StyledLink>
        ))}
      </div>
    </div>
  );
};

export default CasinoPartnerWidget;
