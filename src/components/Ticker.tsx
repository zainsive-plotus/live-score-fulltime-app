// ===== src/components/Ticker.tsx =====

"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Marquee from "react-fast-marquee";
import { IoMdFootball } from "react-icons/io";
import { FaBasketballBall } from "react-icons/fa";
import { IoTennisballOutline } from "react-icons/io5";
import { ITickerMessage } from "@/models/TickerMessage";
import { useTranslation } from "@/hooks/useTranslation";
import StyledLink from "./StyledLink";

const fetchTickerMessages = async (
  locale: string
): Promise<ITickerMessage[]> => {
  const { data } = await axios.get(`/api/ticker-messages?locale=${locale}`);
  return data;
};

const SportSeparator = ({ index }: { index: number }) => {
  const icons = [IoMdFootball, FaBasketballBall, IoTennisballOutline];
  const Icon = icons[index % icons.length];
  return (
    <div className="flex items-center justify-center w-12 h-full">
      <Icon className="text-white/80" size={16} />
    </div>
  );
};

export default function Ticker() {
  const { locale } = useTranslation();

  const { data: messages, isLoading } = useQuery<ITickerMessage[]>({
    queryKey: ["tickerMessages", locale],
    queryFn: () => fetchTickerMessages(locale!),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: !!locale,
  });

  if (isLoading || !messages || messages.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--brand-accent)] text-white py-2 shadow-md">
      <Marquee gradient={false} speed={50}>
        <div className="flex items-center">
          {messages.map((item, index) => (
            <div key={item._id as string} className="flex items-center">
              {/* --- Start of Change --- */}
              {/* Conditionally wrap the message in a link if href exists */}
              {item.href ? (
                <StyledLink
                  href={item.href}
                  className="font-semibold text-sm px-6 whitespace-nowrap hover:underline"
                >
                  {item.message}
                </StyledLink>
              ) : (
                <span className="font-semibold text-sm px-6 whitespace-nowrap">
                  {item.message}
                </span>
              )}
              {/* --- End of Change --- */}
              <SportSeparator index={index} />
            </div>
          ))}
        </div>
      </Marquee>
    </div>
  );
}