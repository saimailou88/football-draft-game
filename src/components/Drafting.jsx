import { useState, useRef, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import PitchPreview from './PitchPreview';
import TeamSpinModal from './TeamSpinModal';

function Drafting({
  selectedFormation,
  formations,
  selectedSeason,
  totalBudget,
  budgetRemaining,
  teamStats,
  hideRating,
  draftedSlots,
  currentTeamSeason,
  currentSquad,
  teamRerollsLeft,
  draftedPlayerNames,
  allSlotsFilled,
  teamsData,
  getPlayerCost,
  getEligibleSlots,
  assignToSlot,
  spinTeam,
  handleTeamReroll,
  startSeason,
  dismissTeamSpin,
  formatSeasonLabel,
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDisplayText, setSpinDisplayText] = useState('');
  const spinIntervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(spinIntervalRef.current);
  }, []);

  const filledCount = Object.keys(draftedSlots).length;
  const totalSlots = formations[selectedFormation].length;
  const budgetLow = budgetRemaining < 10;

  function randomTeamText() {
    const entry = teamsData[Math.floor(Math.random() * teamsData.length)];
    return `${entry.team} ${formatSeasonLabel(entry.season)}`;
  }

  function handleSpinClick() {
    if (isSpinning) return;
    setIsSpinning(true);
    setSpinDisplayText(randomTeamText());

    spinIntervalRef.current = setInterval(() => {
      setSpinDisplayText(randomTeamText());
    }, 45);

    setTimeout(() => {
      clearInterval(spinIntervalRef.current);
      setIsSpinning(false);
      spinTeam(); // commits the real team + opens the pop-up
    }, 1000);
  }

  function statBarWidth(rating) {
    if (rating === null || rating === undefined) return 0;
    return Math.min(100, Math.round((rating / 99) * 100));
  }

  return (
    <div style={{ padding: '20px 24px 60px' }}>
      {currentTeamSeason && (
        <TeamSpinModal
          currentTeamSeason={currentTeamSeason}
          currentSquad={currentSquad}
          selectedFormation={selectedFormation}
          formations={formations}
          draftedSlots={draftedSlots}
          draftedPlayerNames={draftedPlayerNames}
          budgetRemaining={budgetRemaining}
          totalBudget={totalBudget}
          hideRating={hideRating}
          teamRerollsLeft={teamRerollsLeft}
          getPlayerCost={getPlayerCost}
          getEligibleSlots={getEligibleSlots}
          assignToSlot={assignToSlot}
          handleTeamReroll={handleTeamReroll}
          onDismiss={dismissTeamSpin}
          formatSeasonLabel={formatSeasonLabel}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <h1 className="section-title" style={{ fontSize: '30px' }}>{selectedFormation}</h1>
        <div>
          <p className="field-subtext" style={{ textAlign: 'right' }}>SEASON {formatSeasonLabel(selectedSeason)}</p>
          <p className="field-subtext" style={{ textAlign: 'right' }}>POSITIONS FILLED: {filledCount}/{totalSlots}</p>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <PitchPreview
          formationName={selectedFormation}
          formationSlots={formations[selectedFormation]}
          draftedSlots={draftedSlots}
        />
      </div>

      <div className="stats-budget-row" style={{ marginBottom: '10px' }}>
        <div className="stats-column">
          <div className="stat-row">
            <span className="stat-label">GK</span>
            <span className="stat-value">{teamStats.gk ?? '–'}</span>
            <div className="stat-bar-track">
              <div className="stat-bar-fill gk" style={{ width: `${statBarWidth(teamStats.gk)}%` }} />
            </div>
          </div>

          <div className="stat-row">
            <span className="stat-label">DEF</span>
            <span className="stat-value">{teamStats.def ?? '–'}</span>
            <div className="stat-bar-track">
              <div className="stat-bar-fill def" style={{ width: `${statBarWidth(teamStats.def)}%` }} />
            </div>
          </div>

          <div className="stat-row">
            <span className="stat-label">MID</span>
            <span className="stat-value">{teamStats.mid ?? '–'}</span>
            <div className="stat-bar-track">
              <div className="stat-bar-fill mid" style={{ width: `${statBarWidth(teamStats.mid)}%` }} />
            </div>
          </div>

          <div className="stat-row">
            <span className="stat-label">FWD</span>
            <span className="stat-value">{teamStats.fwd ?? '–'}</span>
            <div className="stat-bar-track">
              <div className="stat-bar-fill fwd" style={{ width: `${statBarWidth(teamStats.fwd)}%` }} />
            </div>
          </div>
        </div>
        <div className="overall-display">{teamStats.overall ?? '–'}</div>
      </div>

      <p className={`budget-line ${budgetLow ? 'budget-low' : ''}`} style={{ marginBottom: '16px' }}>
        BUDGET: £{budgetRemaining}M / £{totalBudget}M
      </p>

      {allSlotsFilled ? (
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '24px' }}
          onClick={startSeason}
        >
          SQUAD COMPLETE - SIMULATE SEASON
        </button>
      ) : (
        !currentTeamSeason && (
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '24px' }}
            onClick={handleSpinClick}
            disabled={isSpinning}
          >
            {isSpinning ? spinDisplayText : 'SPIN!'}
          </button>
        )
      )}

      <p className="field-label">Drafted Players</p>
      <div className="slot-list">
        {formations[selectedFormation].map((slot) => (
          <div key={slot.id}>
            {draftedSlots[slot.id] ? (
              <PlayerCard
                player={draftedSlots[slot.id]}
                cost={getPlayerCost(draftedSlots[slot.id].rating_overall)}
                assignedPosition={slot.label}
                origin={{
                  club: draftedSlots[slot.id].club,
                  season: formatSeasonLabel(draftedSlots[slot.id].season_year),
                }}
                hideRating={hideRating}
              />
            ) : (
              <div className="slot-empty">{slot.label}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Drafting;