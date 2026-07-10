import { useState } from 'react';
import PlayerCard from './components/PlayerCard';
import playersData from './data/players.json';
import teamsData from './data/teams.json';
import { formations } from './data/formations';
import './App.css';

const MAX_TEAM_REROLLS = 3;

const POSITION_CATEGORY = {
  GK: "GK",
  CB: "DEF", LB: "DEF", RB: "DEF",
  CDM: "MID", CM: "MID", CAM: "MID", LM: "MID", RM: "MID",
  LW: "FWD", RW: "FWD", ST: "FWD",
};

function App() {
  const [selectedFormation, setSelectedFormation] = useState(null);

  const [currentSquad, setCurrentSquad] = useState(null);
  const [currentTeamSeason, setCurrentTeamSeason] = useState(null);
  const [teamRerollsLeft, setTeamRerollsLeft] = useState(MAX_TEAM_REROLLS);

  const [draftedSlots, setDraftedSlots] = useState({}); // { slotId: player }
  const [draftedPlayerNames, setDraftedPlayerNames] = useState([]);

  function spinTeam() {
    const randomIndex = Math.floor(Math.random() * teamsData.length);
    const chosenTeamSeason = teamsData[randomIndex];

    const squad = playersData
      .filter(
        (player) =>
          player.club === chosenTeamSeason.team &&
          player.season_year === chosenTeamSeason.season
      )
      .sort((a, b) => b.rating_overall - a.rating_overall);

    setCurrentTeamSeason(chosenTeamSeason);
    setCurrentSquad(squad);
    // Note: draftedSlots and draftedPlayerNames are NOT reset here on purpose --
    // rerolling swaps the club/season/players, but keeps whatever you've
    // already drafted into slots so far.
  }

  function handleTeamReroll() {
    if (teamRerollsLeft <= 0) return;
    setTeamRerollsLeft((prev) => prev - 1);
    spinTeam();
  }

  function getEligibleSlots(player) {
    if (!player || !selectedFormation) return [];
    return formations[selectedFormation].filter(
      (slot) =>
        !draftedSlots[slot.id] &&
        slot.eligiblePositions.some((pos) => player.positions.includes(pos))
    );
  }

  function assignToSlot(player, slotId) {
  setDraftedSlots((prev) => ({ ...prev, [slotId]: player }));
  setDraftedPlayerNames((prev) => [...prev, player.player_name]);
  setCurrentTeamSeason(null);
  setCurrentSquad(null);
}

  function calculateTeamStats() {
    const filledPlayers = Object.entries(draftedSlots).map(([slotId, player]) => {
      const slotDef = formations[selectedFormation].find((s) => s.id === slotId);
      return { player, category: POSITION_CATEGORY[slotDef.label] };
    });

    function averageFor(category) {
  const group = filledPlayers.filter((entry) => entry.category === category);
  if (group.length === 0) return null;
  const total = group.reduce((sum, entry) => sum + entry.player.rating_overall, 0);
  return Math.round(total / group.length);
}

const overall =
  filledPlayers.length > 0
    ? Math.round(
        filledPlayers.reduce((sum, entry) => sum + entry.player.rating_overall, 0) /
          filledPlayers.length
      )
    : null;

    return {
      gk: averageFor("GK"),
      def: averageFor("DEF"),
      mid: averageFor("MID"),
      fwd: averageFor("FWD"),
      overall,
    };
  }

  const allSlotsFilled =
    selectedFormation &&
    formations[selectedFormation].every((slot) => draftedSlots[slot.id]);

  return (
    <div className="App">
      {/* Formation picker */}
      <div className="formation-picker">
        <p>Choose a formation:</p>
        {Object.keys(formations).map((formationName) => (
          <button
            key={formationName}
            onClick={() => setSelectedFormation(formationName)}
          >
            {formationName}
          </button>
        ))}
      </div>

      {/* Empty slot layout appears as soon as a formation is picked */}
      {selectedFormation && (
        <>
          <h3>Formation: {selectedFormation}</h3>

          <div className="team-stats">
  {(() => {
    const stats = calculateTeamStats();
    return (
      <>
        <span style={{ marginRight: '16px' }}>GK: {stats.gk ?? "–"}</span>
        <span style={{ marginRight: '16px' }}>DEF: {stats.def ?? "–"}</span>
        <span style={{ marginRight: '16px' }}>MID: {stats.mid ?? "–"}</span>
        <span style={{ marginRight: '16px' }}>FWD: {stats.fwd ?? "–"}</span>
        <span>Overall: {stats.overall ?? "–"}</span>
      </>
    );
  })()}
</div>

          <div className="slot-grid">
            {formations[selectedFormation].map((slot) => (
              <div key={slot.id} className="slot">
                {draftedSlots[slot.id] ? (
                  <PlayerCard player={draftedSlots[slot.id]} />
                ) : (
                  <span>{slot.label} (empty)</span>
                )}
              </div>
            ))}
          </div>

          {!currentTeamSeason && <button onClick={spinTeam}>Spin Team</button>}
        </>
      )}

      {/* Team/season + reroll */}
      {currentTeamSeason && !allSlotsFilled && (
        <>
          <h2>
            {currentTeamSeason.team} — {currentTeamSeason.season}
          </h2>
          <button onClick={handleTeamReroll} disabled={teamRerollsLeft <= 0}>
            Reroll Club/Season ({teamRerollsLeft} left)
          </button>
        </>
      )}

      {/* Squad list to pick from */}
      {currentSquad && !allSlotsFilled && (
        <div className="squad-list">
          {currentSquad
            .filter((player) => !draftedPlayerNames.includes(player.player_name))
            .map((player, index) => {
              const eligibleSlots = getEligibleSlots(player);
              return (
                <div key={index} className="squad-list-item">
                  <PlayerCard player={player} />
                  {eligibleSlots.length > 0 ? (
                    <div className="eligible-slots">
                      {eligibleSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => assignToSlot(player, slot.id)}
                        >
                          Place in {slot.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="no-slot">No open matching slot</span>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {allSlotsFilled && <h3>Squad complete!</h3>}
    </div>
  );
}

export default App;