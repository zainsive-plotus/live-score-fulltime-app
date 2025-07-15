import { formatInTimeZone } from "date-fns-tz";

/**
 * Formats a UTC date string into a localized time string for a specific time zone.
 * This function handles the conversion from UTC to the user's local time zone.
 *
 * @param utcDateString - The date string from the API or database (assumed to be in UTC).
 * @param timeZone - The IANA time zone name (e.g., 'Europe/London').
 * @param formatString - The desired output format (e.g., 'HH:mm').
 * @returns The formatted time string in the specified time zone.
 */
export const formatZonedTime = (
  utcDateString: string | Date,
  timeZone: string,
  formatString: string = "HH:mm"
): string => {
  try {
    // 'UTC' is specified as the input time zone, and the target `timeZone` is provided.
    // This tells date-fns-tz to perform the conversion correctly.
    return formatInTimeZone(utcDateString, timeZone, formatString);
  } catch (error) {
    console.error("Error formatting zoned time:", error);
    // Return a fallback value in case of an invalid date or time zone
    return "--:--";
  }
};
