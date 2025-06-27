// src/app/api/team-details/route.ts
import { NextResponse } from 'next/server';
import { fetchTeamDetails } from '@/lib/data/team'; // <-- IMPORT THE NEW FUNCTION

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team');

    if (!teamId) {
        return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Call the reusable function
    const teamData = await fetchTeamDetails(teamId);

    if (!teamData) {
        // This handles cases where the team isn't found or an error occurred in the lib function.
        return NextResponse.json({ error: 'Failed to fetch team details or team not found' }, { status: 500 });
    }

    return NextResponse.json(teamData);
}