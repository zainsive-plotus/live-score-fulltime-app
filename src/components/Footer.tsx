import Image from "next/image";
import { getI18n } from "@/lib/i18n/server";
import FooterContent from "./FooterContent";
import FooterAboutSection from "./FooterAboutSection";
import StyledLink from "./StyledLink";

// ** THE FIX IS HERE: The component now receives the locale as a prop. **
export default async function Footer({ locale }: { locale: string }) {
  const t = await getI18n(locale);

  return (
    <footer className="bg-brand-secondary text-white">
      {/* Pass the locale down to any other Server Components that need it */}
      <FooterAboutSection locale={locale} />

      <div className="container mx-auto px-4">
        <FooterContent locale={locale} />

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-gray-700/50 py-8 gap-8">
          <div className="flex-shrink-0">
            <Image
              src="/fanskor-transparent.webp"
              alt="Fanskor logo"
              width={200}
              height={28}
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

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-brand-muted border-t border-gray-700/50 pt-6 pb-12">
          <p className="mb-4 md:mb-0 text-center md:text-left">
            © {new Date().getFullYear()} FanSkor - {t("footer_rights_reserved")}
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <StyledLink href="/privacy-policy" className="hover:text-white">
              {t("privacy_policy_title")}
            </StyledLink>
            <StyledLink
              href="/terms-and-conditions"
              className="hover:text-white"
            >
              {t("terms_and_conditions_title")}
            </StyledLink>
            <StyledLink href="/gdpr" className="hover:text-white">
              {t("gdpr_title")}
            </StyledLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
