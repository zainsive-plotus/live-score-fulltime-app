"use client";

import { trackEvent } from "@/lib/ga";
import { default as NextLink, LinkProps } from "next/link";
import NProgress from "nprogress";
import React from "react"; // Import React to use React.CSSProperties

// This is a client-side component that wraps the standard Next.js Link.
// It starts the NProgress bar on click.
export default function StyledLink({
  href,
  children,
  className,
  style, // Add style prop here
  event,
  ...props
}: LinkProps & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties; // Define type for style prop
  event?: string;
} & any) {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (event) {
      trackEvent({
        action: "button_click",
        category: "engagement",
        label: event,
        value: 1,
      });
    }

    // Check if it's a link to a different page before starting the progress bar.
    // This prevents the bar from showing for on-page anchor links.
    const currentPath = window.location.pathname;
    if (href.toString() !== currentPath) {
      NProgress.start();
    }

    // If there's an existing onClick handler, make sure to call it.
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <NextLink
      href={href}
      className={className}
      style={style} // Apply style prop here
      {...props}
      onClick={handleLinkClick}
    >
      {children}
    </NextLink>
  );
}
