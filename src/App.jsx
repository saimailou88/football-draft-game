import { useState, useEffect } from 'react';
import PlayerCard from './components/PlayerCard';
import playersData from './data/players.json';
import teamsData from './data/teams.json';
import { formations } from './data/formations';
import {
  generateFixtures,
  simulateMatch,
  createEmptyYourRecord,
  applyResultToYourRecord,
  createEmptyOpponentSupplement,
  applyResultToOpponentSupplement,
  buildProgressiveTable,
} from './data/simulation';
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

  const [gamePhase, setGamePhase] = useState('drafting'); // 'drafting' | 'simulating' | 'finished'
  const [opponents, setOpponents] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [currentMatchdayIndex, setCurrentMatchdayIndex] = useState(0);
  const [yourRecord, setYourRecord] = useState(createEmptyYourRecord());
  const [opponentSupplement, setOpponentSupplement] = useState(createEmptyOpponentSupplement());
  const [matchHistory, setMatchHistory] = useState([]);

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

  function teamHasPositionMatch(teamSeason, requireAffordable, budgetRemaining) {
    const squad = getSquadForTeamSeason(teamSeason);
    return squad.some((player) => {
      if (draftedPlayerNames.includes(player.player_name)) return false;
      if (requireAffordable && getPlayerCost(player.rating_overall) > budgetRemaining) return false;
      return formations[selectedFormation].some(
        (slot) =>
          !draftedSlots[slot.id] &&
          slot.eligiblePositions.some((pos) => player.positions.includes(pos))
      );
    });
  }

  function spinTeam() {
    const budgetRemaining = calculateBudgetRemaining();

    let pool = teamsData.filter((ts) => teamHasPositionMatch(ts, true, budgetRemaining));

    if (pool.length === 0) {
      pool = teamsData.filter((ts) => teamHasPositionMatch(ts, false, budgetRemaining));
    }

    if (pool.length === 0) {
      pool = teamsData;
    }

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

    if (budgetAfterThisPick < openSlotsAfterThisPick * 0.5) return [];

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

  // Full reset -- season, formation, everything
  function newGame() {
    setSelectedSeason(null);
    setSelectedFormation(null);
    setCurrentSquad(null);
    setCurrentTeamSeason(null);
    setTeamRerollsLeft(MAX_TEAM_REROLLS);
    setDraftedSlots({});
    setDraftedPlayerNames([]);
    setGamePhase('drafting');
    setOpponents([]);
    setFixtures([]);
    setCurrentMatchdayIndex(0);
    setYourRecord(createEmptyYourRecord());
    setOpponentSupplement(createEmptyOpponentSupplement());
    setMatchHistory([]);
  }

  // Squad-only reset -- keeps season and formation, clears the 11 drafted players
  function restartDraft() {
    setCurrentSquad(null);
    setCurrentTeamSeason(null);
    setTeamRerollsLeft(MAX_TEAM_REROLLS);
    setDraftedSlots({});
    setDraftedPlayerNames([]);
  }

  function startSeason() {
    const seasonOpponents = teamsData.filter((t) => t.season === selectedSeason);
    const newFixtures = generateFixtures(seasonOpponents);

    setOpponents(seasonOpponents);
    setFixtures(newFixtures);
    setYourRecord(createEmptyYourRecord());
    setOpponentSupplement(createEmptyOpponentSupplement());
    setCurrentMatchdayIndex(0);
    setMatchHistory([]);
    setGamePhase('simulating');
  }

  function playNextMatchday() {
    if (currentMatchdayIndex >= fixtures.length) return;

    const yourStats = calculateTeamStats();
    const { opponent, isHome } = fixtures[currentMatchdayIndex];

    const { yourGoals, theirGoals } = simulateMatch(yourStats, opponent, isHome);
    const updatedRecord = applyResultToYourRecord(yourRecord, yourGoals, theirGoals);
    const updatedSupplement = applyResultToOpponentSupplement(
      opponentSupplement,
      opponent.team,
      yourGoals,
      theirGoals
    );

    setYourRecord(updatedRecord);
    setOpponentSupplement(updatedSupplement);
    setMatchHistory((prev) => [
      ...prev,
      {
        matchday: currentMatchdayIndex + 1,
        opponent: opponent.team,
        isHome,
        yourGoals,
        theirGoals,
      },
    ]);
    setCurrentMatchdayIndex((prev) => prev + 1);

    if (currentMatchdayIndex + 1 >= fixtures.length) {
      setGamePhase('finished');
    }
  }

  useEffect(() => {
    if (gamePhase !== 'simulating') return;

    const timer = setInterval(() => {
      playNextMatchday();
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, currentMatchdayIndex, fixtures, yourRecord, opponentSupplement]);

  const allSlotsFilled =
    selectedFormation &&
    formations[selectedFormation].every((slot) => draftedSlots[slot.id]);

  return (
    <div className="App">
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
                        assignedPosition={slot.label}
                        origin={{
                          club: draftedSlots[slot.id].club,
                          season: formatSeasonLabel(draftedSlots[slot.id].season_year),
                        }}
                      />
                    ) : (
                      <span>{slot.label} (empty)</span>
                    )}
                  </div>
                ))}
              </div>

              {!currentTeamSeason && !allSlotsFilled && gamePhase === 'drafting' && (
                <button onClick={spinTeam}>Spin Team</button>
              )}
            </>
          )}

          {currentTeamSeason && !allSlotsFilled && gamePhase === 'drafting' && (
            <>
              <h2>
                {currentTeamSeason.team} — {formatSeasonLabel(currentTeamSeason.season)}
              </h2>
              <button onClick={handleTeamReroll} disabled={teamRerollsLeft <= 0}>
                Reroll Club/Season ({teamRerollsLeft} left)
              </button>
            </>
          )}

          {currentSquad && !allSlotsFilled && gamePhase === 'drafting' && (
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

          {allSlotsFilled && gamePhase === 'drafting' && (
            <>
              <h3>Squad complete!</h3>
              <button onClick={startSeason}>Play Season</button>
            </>
          )}

          {(gamePhase === 'simulating' || gamePhase === 'finished') && (
            <div className="simulation-view">
              <h3>
                Matchday {currentMatchdayIndex} / {fixtures.length}
              </h3>

              {gamePhase === 'simulating' ? (
                <p>Simulating...</p>
              ) : (
                <h3>Season complete!</h3>
              )}

              <h4>League Table</h4>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Played</th>
                    <th>Won</th>
                    <th>Drawn</th>
                    <th>Lost</th>
                    <th>Goals For</th>
                    <th>Goals Against</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {buildProgressiveTable(
                    opponents,
                    yourRecord,
                    opponentSupplement,
                    currentMatchdayIndex,
                    fixtures.length
                  ).map((row, index) => (
                    <tr key={row.name} className={row.name === 'Your Team' ? 'your-row' : ''}>
                      <td>{index + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.goalsFor}</td>
                      <td>{row.goalsAgainst}</td>
                      <td>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4>Match History</h4>
              {matchHistory
                .slice()
                .reverse()
                .map((match, index) => (
                  <p key={index}>
                    MD{match.matchday}: {match.isHome ? 'Your Team' : match.opponent}{' '}
                    {match.isHome ? match.yourGoals : match.theirGoals}
                    {' - '}
                    {match.isHome ? match.theirGoals : match.yourGoals}{' '}
                    {match.isHome ? match.opponent : 'Your Team'}
                  </p>
                ))}
            </div>
          )}

          <div className="restart-section" style={{ marginTop: '24px' }}>
            {gamePhase === 'drafting' && (
              <button onClick={restartDraft}>Restart Draft</button>
            )}
            <button onClick={newGame} style={{ marginLeft: '12px' }}>New Game</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;