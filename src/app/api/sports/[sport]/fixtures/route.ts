import { NextResponse } from 'next/server';
import { getSportService } from '@/services/sports';

export async function GET(
  request: Request,
  { params }: { params: { sport: string } }
) {
  const { searchParams } = new URL(request.url);
  const sport = params.sport;
  
  // Convert searchParams to a plain object
  const queryParams: { [key: string]: any } = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  try {
    // 1. Get the correct service for the requested sport
    const sportService = getSportService(sport);
    
    // 2. Call the generic method
    const fixtures = await sportService.getFixtures(queryParams);

    // 3. Return the data
    return NextResponse.json(fixtures);

  } catch (error: any) {
    console.error(`[API /${sport}/fixtures] Error:`, error.message);
    return NextResponse.json(
      { error: `Failed to fetch fixture data for ${sport}.` },
      { status: 500 }
    );
  }
}