"use client";

import { useState, useCallback } from 'react';

const VOTE_STORAGE_KEY = 'matchVotes';

// This custom hook manages getting and setting votes in localStorage.
export function useVoteStorage() {
    // Helper function to safely get votes from localStorage
    const getVotes = useCallback((): { [key: number]: string } => {
        // localStorage is a browser-only API, so we must check if window is defined.
        if (typeof window === 'undefined') {
            return {};
        }
        try {
            const votes = window.localStorage.getItem(VOTE_STORAGE_KEY);
            return votes ? JSON.parse(votes) : {};
        } catch (error) {
            console.error("Error parsing votes from localStorage", error);
            return {};
        }
    }, []);

    // Helper function to save a vote
    const setVote = useCallback((fixtureId: number, choice: 'home' | 'draw' | 'away') => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const allVotes = getVotes();
            allVotes[fixtureId] = choice;
            window.localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(allVotes));
        } catch (error) {
            console.error("Error saving vote to localStorage", error);
        }
    }, [getVotes]);
    
    // Function to check if a vote exists for a specific fixture
    const getVoteForFixture = useCallback((fixtureId: number): string | null => {
        return getVotes()[fixtureId] || null;
    }, [getVotes]);

    return { setVote, getVoteForFixture };
}