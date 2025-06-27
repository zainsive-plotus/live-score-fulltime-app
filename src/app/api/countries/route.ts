import { NextResponse } from 'next/server';
import axios from 'axios';
import { Country } from '@/types/api-football'; // We will define this type

// This function handles GET requests to /api/countries
export async function GET() {
  const options = {
    method: 'GET',
    url: `${process.env.NEXT_PUBLIC_API_FOOTBALL_HOST}/countries`,
    headers: {
      // Securely read API key and host from environment variables
      'x-apisports-key': process.env.NEXT_PUBLIC_API_FOOTBALL_KEY,
    },
  };


  try {
    const response = await axios.request(options);

    // --- Data Transformation ---
    // We will clean and simplify the data before sending it to the frontend.
    const transformedCountries: Country[] = response.data.response
      // 1. Filter out any countries that are missing essential data
      .filter((country: any) => country.name && country.code && country.flag)
      // 2. Map the raw data to our clean, simplified `Country` type
      .map((country: any) => ({
        name: country.name,
        code: country.code,
        flagUrl: country.flag,
      }));

    // 3. Sort the countries alphabetically for a better user experience
    transformedCountries.sort((a, b) => a.name.localeCompare(b.name));
    

    return NextResponse.json(transformedCountries);

  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: 'Failed to fetch country data.' },
      { status: 500 }
    );
  }
}