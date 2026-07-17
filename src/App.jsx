import { useState, useEffect } from 'react';
import PlayerCard from './components/PlayerCard';
import TransferWindow from './components/transferWindow';
import Homepage from './components/Homepage';
import HowToPlay from './components/HowToPlay';
import PlayPrem from './components/PlayPrem';
import Drafting from './components/Drafting';
import Simulating from './components/Simulating';
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
const MIN_BUDGET = 80;
const MAX_BUDGET = 120;
const TRANSFER_WINDOW_MATCHDAY = 20;

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
  if (ratingOverall >= 97) return 20.0;
  if (ratingOverall >= 94) return 18.0;
  if (ratingOverall >= 91) return 16.0;
  if (ratingOverall >= 88) return 14.0;
  if (ratingOverall >= 85) return 12.0;
  if (ratingOverall >= 82) return 10.5;
  if (ratingOverall >= 79) return 9.0;
  if (ratingOverall >= 76) return 8.0;
  if (ratingOverall >= 73) return 7.0;
  if (ratingOverall >= 70) return 6.0;
  if (ratingOverall >= 67) return 5.0;
  if (ratingOverall >= 64) return 4.0;
  if (ratingOverall >= 61) return 3.0;
  if (ratingOverall >= 58) return 2.0;
  if (ratingOverall >= 55) return 1.5;
  if (ratingOverall >= 52) return 1.0;
  if (ratingOverall >= 49) return 1.0;
  return 0.5;
}

// Random integer between MIN_BUDGET and MAX_BUDGET, inclusive
function rollRandomBudget() {
  return Math.floor(Math.random() * (MAX_BUDGET - MIN_BUDGET + 1)) + MIN_BUDGET;
}

function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'howToPlay' | 'game'
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [difficulty, setDifficulty] = useState(null); // 'easy' | 'hard'
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false);

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

  const [showTransferWindow, setShowTransferWindow] = useState(false);
  const [originalDraftAverages, setOriginalDraftAverages] = useState(null);
  const [originalDraftedSlots, setOriginalDraftedSlots] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);

  const [totalBudget, setTotalBudget] = useState(null); // null until rolled

  const availableSeasons = [...new Set(teamsData.map((t) => t.season))].sort(
    (a, b) => a - b
  );

  const hideRating = difficulty === 'hard';

  function calculateBudgetRemaining() {
    const spent = Object.values(draftedSlots).reduce(
      (sum, player) => sum + getPlayerCost(player.rating_overall),
      0
    );
    return (totalBudget ?? 0) - spent;
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

  // Closes the team-spin pop-up without a pick being made -- used when the
  // player has run out of rerolls and every candidate in the current squad
  // is either unaffordable or has no open matching slot. Returns them to
  // the drafting screen where Restart Draft / New Game are reachable.
  function dismissTeamSpin() {
    setCurrentTeamSeason(null);
    setCurrentSquad(null);
  }

  // Generates the real budget value immediately -- called the instant the
  // player taps the button, so the spin animation in PlayPrem is always
  // cycling toward a value that's already decided.
  function generateBudget() {
    return rollRandomBudget();
  }

  // Commits the budget once PlayPrem's 2-second spin animation finishes.
  function handleBudgetRolled(value) {
    setTotalBudget(value);
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

  function newGame() {
    setScreen('home');
    setSelectedSeason(null);
    setDifficulty(null);
    setSelectedFormation(null);
    setSetupComplete(false);
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
    setShowTransferWindow(false);
    setOriginalDraftAverages(null);
    setOriginalDraftedSlots(null);
    setTransferHistory([]);
    setTotalBudget(null);
  }

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
    setOriginalDraftAverages(calculateTeamStats());
    setOriginalDraftedSlots({ ...draftedSlots });
    setTransferHistory([]);
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

    const newIndex = currentMatchdayIndex + 1;
    setCurrentMatchdayIndex(newIndex);

    if (newIndex === TRANSFER_WINDOW_MATCHDAY && newIndex < fixtures.length) {
      setShowTransferWindow(true);
    }

    if (newIndex >= fixtures.length) {
      setGamePhase('finished');
    }
  }

  function handleTransferWindowComplete(updatedSlots, history) {
    setDraftedSlots(updatedSlots);
    setDraftedPlayerNames(Object.values(updatedSlots).map((p) => p.player_name));
    setTransferHistory(history);
    setShowTransferWindow(false);
  }

  useEffect(() => {
    if (gamePhase !== 'simulating') return;
    if (showTransferWindow) return;

    const timer = setInterval(() => {
      playNextMatchday();
    }, 700);

    return () => clearInterval(timer);
  }, [gamePhase, currentMatchdayIndex, fixtures, yourRecord, opponentSupplement, showTransferWindow]);

  const allSlotsFilled =
    selectedFormation &&
    formations[selectedFormation].every((slot) => draftedSlots[slot.id]);

  // In Hard Mode, ratings stay hidden only while actively drafting -- once
  // the full squad is complete, they reveal. Rewards finishing the draft
  // rather than leaving the player guessing indefinitely.
  const hideRatingWhileDrafting = hideRating && !allSlotsFilled;

  return (
    <div className="App">
      {screen === 'home' && (
        <Homepage
          onPlayClick={() => setScreen('game')}
          onHowToPlayClick={() => setScreen('howToPlay')}
        />
      )}

      {screen === 'howToPlay' && (
        <HowToPlay onBack={() => setScreen('home')} />
      )}

      {screen === 'game' && (
        <>
          {showTransferWindow && (
            <TransferWindow
              draftedSlots={draftedSlots}
              formationSlots={formations[selectedFormation]}
              allPlayers={playersData}
              draftedPlayerNames={draftedPlayerNames}
              positionCategory={POSITION_CATEGORY}
              hideRating={hideRating}
              getPlayerCost={getPlayerCost}
              onComplete={handleTransferWindowComplete}
            />
          )}

          {!setupComplete && (
            <PlayPrem
              difficulty={difficulty}
              onSelectDifficulty={setDifficulty}
              availableSeasons={availableSeasons}
              selectedSeason={selectedSeason}
              onSelectSeason={setSelectedSeason}
              formations={formations}
              selectedFormation={selectedFormation}
              onSelectFormation={setSelectedFormation}
              totalBudget={totalBudget}
              minBudget={MIN_BUDGET}
              maxBudget={MAX_BUDGET}
              onGenerateBudget={generateBudget}
              onBudgetRolled={handleBudgetRolled}
              onConfirmPlay={() => setSetupComplete(true)}
              onBack={() => setScreen('home')}
            />
          )}

          {setupComplete && (
            <>
              {gamePhase === 'drafting' && (
                <Drafting
                  selectedFormation={selectedFormation}
                  formations={formations}
                  selectedSeason={selectedSeason}
                  totalBudget={totalBudget}
                  budgetRemaining={calculateBudgetRemaining()}
                  teamStats={calculateTeamStats()}
                  hideRating={hideRatingWhileDrafting}
                  draftedSlots={draftedSlots}
                  currentTeamSeason={currentTeamSeason}
                  currentSquad={currentSquad}
                  teamRerollsLeft={teamRerollsLeft}
                  draftedPlayerNames={draftedPlayerNames}
                  allSlotsFilled={allSlotsFilled}
                  teamsData={teamsData}
                  getPlayerCost={getPlayerCost}
                  getEligibleSlots={getEligibleSlots}
                  assignToSlot={assignToSlot}
                  spinTeam={spinTeam}
                  handleTeamReroll={handleTeamReroll}
                  dismissTeamSpin={dismissTeamSpin}
                  startSeason={startSeason}
                  formatSeasonLabel={formatSeasonLabel}
                />
              )}

              {(gamePhase === 'simulating' || gamePhase === 'finished') && (
                <Simulating
                  selectedFormation={selectedFormation}
                  formations={formations}
                  selectedSeason={selectedSeason}
                  draftedSlots={draftedSlots}
                  gamePhase={gamePhase}
                  showTransferWindow={showTransferWindow}
                  currentMatchdayIndex={currentMatchdayIndex}
                  fixtures={fixtures}
                  opponents={opponents}
                  yourRecord={yourRecord}
                  opponentSupplement={opponentSupplement}
                  matchHistory={matchHistory}
                  hideRating={hideRating}
                  getPlayerCost={getPlayerCost}
                  formatSeasonLabel={formatSeasonLabel}
                  buildProgressiveTable={buildProgressiveTable}
                  originalDraftAverages={originalDraftAverages}
                  calculateTeamStats={calculateTeamStats}
                  transferHistory={transferHistory}
                  originalDraftedSlots={originalDraftedSlots}
                />
              )}

              <div className="footer-nav-row" style={{ padding: '0 24px' }}>
            {gamePhase === 'drafting' && (
              <button
                className="btn btn-dark"
                onClick={restartDraft}
                style={{ padding: '10px 16px', fontSize: '13px', flex: 1 }}
              >
                RESTART DRAFT
              </button>
            )}
            <button
              className="btn btn-dark"
              onClick={newGame}
              style={{ padding: '10px 16px', fontSize: '13px', flex: 1 }}
            >
              NEW GAME
            </button>
          </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;