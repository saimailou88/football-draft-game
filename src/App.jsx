import { useState } from 'react';
import PlayerCard from './components/PlayerCard';
import playersData from './data/players.json';
import teamsData from './data/teams.json';
import { formations } from './data/formations';
import './App.css';

const MAX_TEAM_REROLLS = 3;
const TOTAL_BUDGET = 100;

const POSITION_CATEGORY = {
  GK: "GK",
  CB: "DEF", LB: "DEF", RB: "DEF",
  CDM: "MID", CM: "MID", CAM: "MID", LM: "MID", RM: "MID",
  LW: "FWD", RW: "FWD", ST: "FWD",
};

function formatSeasonLabel(season) {
  const nextYearShort = (season + 1).toString().slice(-2);
  return `${season}-${nextYearShort}`;
}

function getPlayerCost(ratingOverall) {
  if (ratingOverall >= 99) return 20.0;
  if (ratingOverall >= 97) return 18.0;
  if (ratingOverall >= 94) return 16.0;
  if (ratingOverall >= 91) return 14.0;
  if (ratingOverall >= 88) return 12.0;
  if (ratingOverall >= 85) return 10.5;
  if (ratingOverall >= 82) return 9.0;
  if (ratingOverall >= 79) return 8.0;
  if (ratingOverall >= 76) return 7.0;
  if (ratingOverall >= 73) return 6.0;
  if (ratingOverall >= 70) return 5.0;
  if (ratingOverall >= 67) return 4.0;
  if (ratingOverall >= 64) return 3.0;
  if (ratingOverall >= 61) return 2.0;
  if (ratingOverall >= 58) return 1.5;
  if (ratingOverall >= 55) return 1.0;
  if (ratingOverall >= 52) return 1.0;
  if (ratingOverall >= 49) return 0.5;
  return 0.5;
}

function App() {
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState(null);

  const [currentSquad, setCurrentSquad] = useState(null);
  const [currentTeamSeason, setCurrentTeamSeason] = useState(null);
  const [teamRerollsLeft, setTeamRerollsLeft] = useState(MAX_TEAM_REROLLS);

  const [draftedSlots, setDraftedSlots] = useState({}); // { slotId: player }
  const [draftedPlayerNames, setDraftedPlayerNames] = useState([]);

  // All distinct seasons available in the data, sorted ascending
  const availableSeasons = [...new Set(teamsData.map((t) => t.season))].sort(
    (a, b) => a - b
  );

  function calculateBudgetRemaining() {
    const spent = Object.values(draftedSlots).reduce(
      (sum, player) => sum + getPlayerCost(player.rating_overall),
      0
    );
    return TOTAL_BUDGET - spent;
  }

  function getSquadForTeamSeason(teamSeason) {
    return playersData.filter(
      (player) =>
        player.club === teamSeason.team && player.season_year === teamSeason.season
    );
  }

  function teamHasViablePlayer(teamSeason, budgetRemaining) {
    const squad = getSquadForTeamSeason(teamSeason);
    return squad.some((player) => {
      if (draftedPlayerNames.includes(player.player_name)) return false;
      if (getPlayerCost(player.rating_overall) > budgetRemaining) return false;
      return formations[selectedFormation].some(
        (slot) =>
          !draftedSlots[slot.id] &&
          slot.eligiblePositions.some((pos) => player.positions.includes(pos))
      );
    });
  }

  function spinTeam() {
    const budgetRemaining = calculateBudgetRemaining();
    const viableTeams = teamsData.filter((ts) =>
      teamHasViablePlayer(ts, budgetRemaining)
    );
    const pool = viableTeams.length > 0 ? viableTeams : teamsData;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosenTeamSeason = pool[randomIndex];

    const squad = getSquadForTeamSeason(chosenTeamSeason).sort(
      (a, b) => b.rating_overall - a.rating_overall
    );

    setCurrentTeamSeason(chosenTeamSeason);
    setCurrentSquad(squad);
  }

  function handleTeamReroll() {
    if (teamRerollsLeft <= 0) return;
    setTeamRerollsLeft((prev) => prev - 1);
    spinTeam();
  }

  function getEligibleSlots(player) {
    if (!player || !selectedFormation) return [];
    const budgetRemaining = calculateBudgetRemaining();
    const cost = getPlayerCost(player.rating_overall);
    if (cost > budgetRemaining) return [];

    const totalSlots = formations[selectedFormation].length;
    const filledSlotsCount = Object.keys(draftedSlots).length;
    const openSlotsAfterThisPick = totalSlots - filledSlotsCount - 1;
    const budgetAfterThisPick = budgetRemaining - cost;

    if (budgetAfterThisPick < openSlotsAfterThisPick * 1) return [];

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

  function restartDraft() {
    setSelectedSeason(null);
    setSelectedFormation(null);
    setCurrentSquad(null);
    setCurrentTeamSeason(null);
    setTeamRerollsLeft(MAX_TEAM_REROLLS);
    setDraftedSlots({});
    setDraftedPlayerNames([]);
  }

  const allSlotsFilled =
    selectedFormation &&
    formations[selectedFormation].every((slot) => draftedSlots[slot.id]);

  return (
    <div className="App">
      {/* Step 1: Season selector -- picks which real league your squad will play against later */}
      {!selectedSeason && (
        <div className="season-picker">
          <p>Choose a season to play against:</p>
          <select
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            defaultValue=""
          >
            <option value="" disabled>
              Select a season
            </option>
            {availableSeasons.map((season) => (
              <option key={season} value={season}>
                {formatSeasonLabel(season)}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedSeason && (
        <>
          <p>Playing against the {formatSeasonLabel(selectedSeason)} season</p>

          {/* Step 2: Formation picker */}
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

              <p>Budget remaining: £{calculateBudgetRemaining()}m</p>

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
                      <PlayerCard
                        player={draftedSlots[slot.id]}
                        cost={getPlayerCost(draftedSlots[slot.id].rating_overall)}
                      />
                    ) : (
                      <span>{slot.label} (empty)</span>
                    )}
                  </div>
                ))}
              </div>

              {!currentTeamSeason && !allSlotsFilled && (
                <button onClick={spinTeam}>Spin Team</button>
              )}
            </>
          )}

          {/* Team/season + reroll */}
          {currentTeamSeason && !allSlotsFilled && (
            <>
              <h2>
                {currentTeamSeason.team} — {formatSeasonLabel(currentTeamSeason.season)}
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
                .slice()
                .sort((a, b) => {
                  const budgetRemaining = calculateBudgetRemaining();

                  const aFits = getEligibleSlots(a).length > 0 ? 1 : 0;
                  const bFits = getEligibleSlots(b).length > 0 ? 1 : 0;
                  if (aFits !== bFits) return bFits - aFits;

                  const aAfford = getPlayerCost(a.rating_overall) <= budgetRemaining ? 1 : 0;
                  const bAfford = getPlayerCost(b.rating_overall) <= budgetRemaining ? 1 : 0;
                  if (aAfford !== bAfford) return bAfford - aAfford;

                  return b.rating_overall - a.rating_overall;
                })
                .map((player, index) => {
                  const eligibleSlots = getEligibleSlots(player);
                  return (
                    <div key={index} className="squad-list-item">
                      <PlayerCard
                        player={player}
                        cost={getPlayerCost(player.rating_overall)}
                      />
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
                        <span className="no-slot">
                          {getPlayerCost(player.rating_overall) > calculateBudgetRemaining()
                            ? "Can't afford"
                            : "No open matching slot"}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {allSlotsFilled && (
            <>
              <h3>Squad complete!</h3>
              <button
                onClick={() =>
                  console.log('Play Season clicked - simulation UI comes next')
                }
              >
                Play Season
              </button>
            </>
          )}

          <div className="restart-section" style={{ marginTop: '24px' }}>
            <button onClick={restartDraft}>Restart Draft</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;