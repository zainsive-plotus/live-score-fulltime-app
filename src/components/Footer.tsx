// ===== src/components/Footer.tsx =====

import Image from "next/image";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { headers } from "next/headers";
import FooterContent from "./FooterContent";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/config";

// Helper to get locale from pathname on the server
const getLocaleFromPathname = (pathname: string) => {
  const firstSegment = pathname.split("/")[1];
  if (SUPPORTED_LOCALES.includes(firstSegment)) {
    return firstSegment;
  }
  return DEFAULT_LOCALE;
};

export default async function Footer() {
  const pathname = (await headers()).get("x-next-pathname") || "/";
  const locale = getLocaleFromPathname(pathname);
  const t = await getI18n(locale);

  return (
    <footer className="bg-brand-secondary text-white py-12">
      <div className="container mx-auto px-4">
        <FooterContent locale={locale} />

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-700/50 pt-8 mb-8">
          <div className="mb-6 md:mb-0">
            <Image
              src="/fanskor-transparent.webp"
              alt="Fanskor logo"
              width={280}
              height={40}
            />
          </div>
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
            © {new Date().getFullYear()} Fan skor -{" "}
            {t("footer_rights_reserved")}
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
