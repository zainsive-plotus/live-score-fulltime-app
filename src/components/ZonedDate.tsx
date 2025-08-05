// ===== src/components/ZonedDate.tsx =====
"use client";

import { useState, useEffect } from "react";
import { useTimeZone } from "@/context/TimeZoneContext";
import { formatZonedTime } from "@/lib/date-formatter";

interface ZonedDateProps {
  date: string | Date;
  format?: string;
}

export default function ZonedDate({ date, format = "HH:mm" }: ZonedDateProps) {
  const { timeZone } = useTimeZone();
  const [isMounted, setIsMounted] = useState(false);

  // This useEffect ensures the component is only rendered on the client after hydration.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // On the server and before hydration, render a placeholder.
  if (!isMounted || !timeZone) {
    const fallbackTime = new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    return <span className="tabular-nums">{fallbackTime}</span>;
  }

  // Once mounted on the client, render the correctly zoned time.
  const formattedDate = formatZonedTime(date, timeZone, format);

  return <span className="tabular-nums">{formattedDate}</span>;
}
