// ===== src/components/Footer.tsx =====

"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

const FooterContentSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-4">
        <div className="h-5 w-1/2 bg-gray-700 rounded"></div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-gray-600 rounded"></div>
          <div className="h-4 w-full bg-gray-600 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-600 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

const FooterContent = dynamic(() => import("./FooterContent"), {
  loading: () => <FooterContentSkeleton />,
  ssr: false,
});

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-brand-secondary text-white py-12">
      <div className="container mx-auto px-4">
        {}
        <FooterContent />

        {}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-700/50 pt-8 mb-8">
          <div className="mb-6 md:mb-0">
            <Image
              src="/fanskor-transparent.webp"
              alt="Fanskor logo"
              width={280}
              height={40}
            />
          </div>
          {/* CORRECTED: Added flex-wrap, justify-center, and specific gaps for responsiveness */}
          <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-4 md:gap-8">
            <Image
              src="/images/logos/18plus.svg"
              alt="18+ Responsible Gaming"
              width={40}
              height={40}
            />
            <Image
              src="/images/logos/gamcare.svg"
              alt="GamCare Verified"
              width={110}
              height={35}
            />
            <Image
              src="/images/logos/begambleaware.svg"
              alt="BeGambleAware"
              width={190}
              height={25}
            />
            <Image
              src="/images/logos/dmca-protected.svg"
              alt="DMCA Protected"
              width={180}
              height={35}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-brand-muted">
          <p className="mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} Fan skor -{t("footer_rights_reserved")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-white">
              {t("privacy_policy_title")}
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white">
              {t("terms_and_conditions_title")}
            </Link>
            <Link href="/gdpr" className="hover:text-white">
              {t("gdpr_title")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
