// src/components/SocialShareButtons.tsx
"use client";

import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  XIcon, // The new icon for Twitter
  WhatsappShareButton,
  WhatsappIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TelegramShareButton,
  TelegramIcon,
  RedditShareButton,
  RedditIcon,
} from "react-share";

interface SocialShareButtonsProps {
  url: string;
  title: string;
}

export default function SocialShareButtons({
  url,
  title,
}: SocialShareButtonsProps) {
  const iconSize = 48;
  const iconBgStyle = { background: "none" };
  const iconClassName =
    "rounded-full transition-transform duration-200 hover:scale-110";

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <FacebookShareButton url={url} quote={title} className={iconClassName}>
        <FacebookIcon size={iconSize} round bgStyle={iconBgStyle} />
      </FacebookShareButton>

      <TwitterShareButton url={url} title={title} className={iconClassName}>
        <XIcon size={iconSize} round bgStyle={iconBgStyle} />
      </TwitterShareButton>

      <WhatsappShareButton
        url={url}
        title={title}
        separator=":: "
        className={iconClassName}
      >
        <WhatsappIcon size={iconSize} round bgStyle={iconBgStyle} />
      </WhatsappShareButton>

      <LinkedinShareButton url={url} title={title} className={iconClassName}>
        <LinkedinIcon size={iconSize} round bgStyle={iconBgStyle} />
      </LinkedinShareButton>

      {/* <TelegramShareButton url={url} title={title} className={iconClassName}>
        <TelegramIcon size={iconSize} round bgStyle={iconBgStyle} />
      </TelegramShareButton> */}
      {/*       
      <RedditShareButton url={url} title={title} className={iconClassName}>
        <RedditIcon size={iconSize} round bgStyle={iconBgStyle} />
      </RedditShareButton> */}
    </div>
  );
}
