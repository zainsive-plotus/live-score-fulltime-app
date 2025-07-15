"use client";

import { default as NextLink, LinkProps } from "next/link";
import NProgress from "nprogress";
import React from "react";
import { sendGAEvent } from "@/lib/analytics"; // <-- Import our new helper

export default function StyledLink({
  href,
  children,
  className,
  style,
  // Add new props for GA event tracking
  gaEventName,
  gaEventParams,
  ...props
}: LinkProps & {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  gaEventName?: string;
  gaEventParams?: { [key: string]: any };
} & any) {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Fire the GA event if the name is provided
    if (gaEventName) {
      sendGAEvent(gaEventName, gaEventParams || {});
    }

    // Handle NProgress
    const currentPath = window.location.pathname;
    if (href.toString() !== currentPath) {
      NProgress.start();
    }

    // Call any original onClick handler
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <NextLink
      href={href}
      className={className}
      style={style}
      {...props}
      onClick={handleLinkClick}
    >
      {children}
    </NextLink>
  );
}
