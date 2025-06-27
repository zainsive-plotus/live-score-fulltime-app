"use client";

import StyledLink from "../StyledLink";
import { Globe } from "lucide-react";

export default function BrowseByCountry() {
    return (
        <StyledLink href="/countries" className="block w-full bg-brand-secondary p-4 rounded-lg text-center hover:bg-gray-700/50 transition-colors">
            <Globe className="mx-auto mb-2 text-brand-muted" size={32} />
            <h3 className="font-bold text-lg text-white">Browse by Country</h3>
            <p className="text-sm text-brand-muted">Find leagues and cups from all over the world.</p>
        </StyledLink>
    );
}