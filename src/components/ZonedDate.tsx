"use client";

import { useTimeZone } from "@/context/TimeZoneContext";
import { formatZonedTime } from "@/lib/date-formatter";

interface ZonedDateProps {
  /**
   * The date string from the API/database, assumed to be in UTC.
   */
  date: string | Date;
  /**
   * The desired output format string (e.g., 'HH:mm', 'dd MMM yyyy').
   * @default 'HH:mm'
   */
  format?: string;
}

/**
 * A client component that displays a UTC date in the user's local time zone.
 * It shows a placeholder on initial render and updates to the local time
 * once the client-side time zone is detected.
 */
export default function ZonedDate({ date, format = "HH:mm" }: ZonedDateProps) {
  const { timeZone } = useTimeZone();

  // On the server or before the client-side time zone is detected,
  // timeZone will be null. We render a placeholder.
  if (!timeZone) {
    return <span className="tabular-nums">--:--</span>;
  }

  // Once the timeZone is available on the client, we format and display the local time.
  const formattedDate = formatZonedTime(date, timeZone, format);

  return <span className="tabular-nums">{formattedDate}</span>;
}
