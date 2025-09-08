// ===== src/components/image-templates/FixtureImageTemplate.tsx =====

import React from "react";

// The interface for the component's props
interface FixtureImageTemplateProps {
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamName: string;
  awayTeamLogo: string;
  leagueName: string;
}

// THIS IS THE FIX:
// We define the component as a constant and directly apply the props type to its parameters.
// This is a clearer pattern for TypeScript than using React.FC in this context.
export const FixtureImageTemplate = ({
  homeTeamName,
  homeTeamLogo,
  awayTeamName,
  awayTeamLogo,
  leagueName,
}: FixtureImageTemplateProps) => {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: '"Poppins"',
        color: "white",
        background: "linear-gradient(to bottom, #1e1b2e, #13111e)",
        padding: "48px",
      }}
    >
      {/* Top Section: League Name */}
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          fontSize: 28,
          color: "#9e9e9e",
        }}
      >
        {leagueName}
      </div>

      {/* Main Content: Teams */}
      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {/* Home Team */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            width: 400,
          }}
        >
          <img
            src={homeTeamLogo}
            alt={`${homeTeamName} logo`}
            width={200}
            height={200}
            style={{ objectFit: "contain" }}
          />
          <div style={{ fontSize: 48, fontWeight: 700, textAlign: "center" }}>
            {homeTeamName}
          </div>
        </div>

        {/* VS Separator */}
        <div style={{ fontSize: 96, fontWeight: 900, color: "#9e9e9e" }}>
          VS
        </div>

        {/* Away Team */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            width: 400,
          }}
        >
          <img
            src={awayTeamLogo}
            alt={`${awayTeamName} logo`}
            width={200}
            height={200}
            style={{ objectFit: "contain" }}
          />
          <div style={{ fontSize: 48, fontWeight: 700, textAlign: "center" }}>
            {awayTeamName}
          </div>
        </div>
      </div>

      {/* Bottom Section: Fanskor Logo */}
      <div
        style={{
          display: "flex",
          alignSelf: "flex-end",
          fontSize: 32,
          fontWeight: 800,
          color: "#ed5c19",
        }}
      >
        Fanskor
      </div>
    </div>
  );
};
