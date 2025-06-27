import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Vote from '@/models/Vote';

// --- GET Handler: Fetches vote counts for a fixture ---
export async function GET(request: Request) {
    console.log("requested here");
    
    const { searchParams } = new URL(request.url);
    const fixtureId = searchParams.get('fixture');

    if (!fixtureId) {
        return NextResponse.json({ error: 'Fixture ID is required' }, { status: 400 });
    }

    try {
        await dbConnect();
        const votes = await Vote.findOne({ fixtureId: Number(fixtureId) });
        console.log(votes);
        

        if (!votes) {
            // If no votes yet, return a default object
            return NextResponse.json({ homeVotes: 0, drawVotes: 0, awayVotes: 0 });
        }

        return NextResponse.json(votes);
    } catch (error) {
        console.log(error);
        
        return NextResponse.json({ error: 'Server error fetching votes' }, { status: 500 });
    }
}


// --- POST Handler: Submits a new vote ---
export async function POST(request: Request) {
    const { fixtureId, vote } = await request.json(); // vote should be 'home', 'draw', or 'away'

    if (!fixtureId || !['home', 'draw', 'away'].includes(vote)) {
        return NextResponse.json({ error: 'Valid fixtureId and vote type are required' }, { status: 400 });
    }
    
    try {
        await dbConnect();
        
        // Atomically find and update the document, or create it if it doesn't exist.
        // The $inc operator is crucial for preventing race conditions.
        const updatedVote = await Vote.findOneAndUpdate(
            { fixtureId: Number(fixtureId) },
            { $inc: { [`${vote}Votes`]: 1 } },
            { 
                upsert: true, // Create the document if it doesn't exist
                new: true     // Return the updated document
            }
        );

        return NextResponse.json(updatedVote);
    } catch (error) {
        return NextResponse.json({ error: 'Server error submitting vote' }, { status: 500 });
    }
}