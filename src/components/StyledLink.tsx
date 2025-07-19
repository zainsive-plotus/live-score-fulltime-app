"use client";

import { default as NextLink, LinkProps } from "next/link";
import NProgress from "nprogress";
import React from "react";
import { sendGAEvent } from "@/lib/analytics";
import { useTranslation } from "@/hooks/useTranslation";
import { usePathname } from "next/navigation";

const DEFAULT_LOCALE = "tr";

export default function StyledLink({
  href,
  children,
  className,
  style,
  gaEventName,
  gaEventParams,
  ...props
}: LinkProps & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  gaEventName?: string;
  gaEventParams?: { [key: string]: any };
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const currentPathname = usePathname();

  // --- START OF FIX ---
  // Conditionally call the hook based on the route
  const isAdminRoute = currentPathname.startsWith("/admin");
  const i18n = !isAdminRoute ? useTranslation() : { locale: DEFAULT_LOCALE };
  const { locale } = i18n;
  // --- END OF FIX ---

  const isExternal =
    typeof href === "string" &&
    (href.startsWith("http") || href.startsWith("mailto:"));
  const isAnchor = typeof href === "string" && href.startsWith("#");

  // --- MODIFIED LOGIC ---
  // Do not add locale prefix for admin links
  const isAdminLink = typeof href === "string" && href.startsWith("/admin");
  // --- END MODIFIED LOGIC ---

  let localizedHref = href;

  if (!isExternal && !isAnchor && !isAdminLink) {
    if (locale === DEFAULT_LOCALE) {
      localizedHref = href;
    } else {
      localizedHref = `/${locale}${href}`;
    }
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (gaEventName) {
      sendGAEvent(gaEventName, gaEventParams || {});
    }

    if (localizedHref.toString() !== currentPathname) {
      NProgress.start();
    }

    if (props.onClick) {
      props.onClick(e);
    }
  };

  if (isExternal) {
    return (
      <a
        href={href as string}
        className={className}
        style={style}
        {...props}
        onClick={handleLinkClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink
      href={localizedHref}
      className={className}
      style={style}
      {...props}
      onClick={handleLinkClick}
    >
      {children}
    </NextLink>
  );
}
