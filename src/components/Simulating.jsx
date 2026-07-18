import { useState, useRef, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import PitchPreview from './PitchPreview';
import EndOfSeasonSummary from './EndOfSeasonSummary';

function resultType(match) {
  const yourGoals = match.isHome ? match.yourGoals : match.theirGoals;
  const theirGoals = match.isHome ? match.theirGoals : match.yourGoals;
  if (yourGoals > theirGoals) return 'win';
  if (yourGoals < theirGoals) return 'loss';
  return 'draw';
}

function Simulating({
  selectedFormation,
  formations,
  selectedSeason,
  teamName,
  draftedSlots,
  gamePhase,
  showTransferWindow,
  currentMatchdayIndex,
  fixtures,
  opponents,
  yourRecord,
  opponentSupplement,
  matchHistory,
  hideRating,
  getPlayerCost,
  formatSeasonLabel,
  buildProgressiveTable,
  originalDraftAverages,
  calculateTeamStats,
  transferHistory,
  originalDraftedSlots,
}) {
  const [showSquad, setShowSquad] = useState(false);
  const prevRankRef = useRef(null);

  const leagueTable = buildProgressiveTable(
    opponents,
    yourRecord,
    opponentSupplement,
    currentMatchdayIndex,
    fixtures.length
  );

  const yourIndex = leagueTable.findIndex((row) => row.name === 'Your Team');
  const yourRank = yourIndex + 1;

  // Determines whether "Your Team"'s row should flash green (moved up the
  // table) or red (moved down) compared to last matchday, rather than
  // always showing the same flat highlight color.
  let yourRowMovement = 'same';
  if (prevRankRef.current !== null) {
    if (yourRank < prevRankRef.current) yourRowMovement = 'up';
    else if (yourRank > prevRankRef.current) yourRowMovement = 'down';
  }

  useEffect(() => {
    prevRankRef.current = yourRank;
  }, [currentMatchdayIndex]);

  // Which formation slots have a different player now than what was
  // originally drafted -- used to color those pitch dots and cards purple.
  const transferredSlotIds = new Set();
  if (originalDraftedSlots) {
    formations[selectedFormation].forEach((slot) => {
      const original = originalDraftedSlots[slot.id];
      const current = draftedSlots[slot.id];
      if (original && current && original.player_name !== current.player_name) {
        transferredSlotIds.add(slot.id);
      }
    });
  }

  // Falls back to a generic label if the player left the team name field
  // blank -- used everywhere "Your Team" would otherwise be shown.
  const displayTeamName = teamName || 'YOUR TEAM';

  return (
    <div style={{ padding: '20px 24px 60px' }}>
      <h1 className="section-title" style={{ fontSize: '30px', marginBottom: '12px' }}>{displayTeamName}</h1>

      <div className="info-row" style={{ marginBottom: '16px' }}>
        <span className="info-item">SEASON {formatSeasonLabel(selectedSeason)}</span>
        <span className="info-dot">·</span>
        <span className="info-item">{selectedFormation}</span>
        <span className="info-dot">·</span>
        <span className="info-item">
          MATCHDAY {currentMatchdayIndex}/{fixtures.length}
        </span>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <PitchPreview
          formationName={selectedFormation}
          formationSlots={formations[selectedFormation]}
          draftedSlots={draftedSlots}
          transferredSlotIds={transferredSlotIds}
        />
      </div>

      <button
        className="btn btn-dark"
        style={{ width: '100%', marginBottom: '10px' }}
        onClick={() => setShowSquad((prev) => !prev)}
      >
        {showSquad ? 'HIDE TEAM PLAYERS ▲' : 'SHOW TEAM PLAYERS ▼'}
      </button>

      {(() => {
        const liveStats = calculateTeamStats();
        function statBarWidth(rating) {
          if (rating === null || rating === undefined) return 0;
          return Math.min(100, Math.round((rating / 99) * 100));
        }

        // Compares current live overall to the draft-day baseline so the
        // big number can reflect improvement (green) or decline (red)
        // after a transfer window, rather than always sitting neutral purple.
        let overallDirectionClass = '';
        if (originalDraftAverages && liveStats.overall !== null && originalDraftAverages.overall !== null) {
          if (liveStats.overall > originalDraftAverages.overall) overallDirectionClass = 'overall-up';
          else if (liveStats.overall < originalDraftAverages.overall) overallDirectionClass = 'overall-down';
        }

        return (
          <div className="stats-budget-row" style={{ marginBottom: '20px' }}>
            <div className="stats-column">
              <div className="stat-row">
                <span className="stat-label">GK</span>
                <span className="stat-value">{liveStats.gk ?? '–'}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill gk" style={{ width: `${statBarWidth(liveStats.gk)}%` }} />
                </div>
              </div>
              <div className="stat-row">
                <span className="stat-label">DEF</span>
                <span className="stat-value">{liveStats.def ?? '–'}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill def" style={{ width: `${statBarWidth(liveStats.def)}%` }} />
                </div>
              </div>
              <div className="stat-row">
                <span className="stat-label">MID</span>
                <span className="stat-value">{liveStats.mid ?? '–'}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill mid" style={{ width: `${statBarWidth(liveStats.mid)}%` }} />
                </div>
              </div>
              <div className="stat-row">
                <span className="stat-label">FWD</span>
                <span className="stat-value">{liveStats.fwd ?? '–'}</span>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill fwd" style={{ width: `${statBarWidth(liveStats.fwd)}%` }} />
                </div>
              </div>
            </div>
            <div className={`overall-display ${overallDirectionClass}`}>{liveStats.overall ?? '–'}</div>
          </div>
        );
      })()}

      {showSquad && (
        <div className="slot-list" style={{ marginBottom: '20px' }}>
          {formations[selectedFormation].map((slot) => {
            const player = draftedSlots[slot.id];
            if (!player) return null;

            const original = originalDraftedSlots ? originalDraftedSlots[slot.id] : null;
            const wasTransferred = original && original.player_name !== player.player_name;

            if (wasTransferred) {
              const isUpgrade = player.rating_overall > original.rating_overall;
              const isDowngrade = player.rating_overall < original.rating_overall;
              const tradeResult = isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : null;

              return (
                <div key={slot.id} className="player-comparison-row">
                  <PlayerCard
                    player={original}
                    cost={getPlayerCost(original)}
                    assignedPosition={slot.label}
                    origin={{ club: original.club, season: formatSeasonLabel(original.season_year) }}
                    hideRating={false}
                  />
                  <div className="comparison-arrow">↓ TRANSFERRED ↓</div>
                  <PlayerCard
                    player={player}
                    assignedPosition={slot.label}
                    origin={{ club: player.club, season: formatSeasonLabel(player.season_year) }}
                    hideRating={false}
                    tradeResult={tradeResult}
                  />
                </div>
              );
            }

            return (
              <PlayerCard
                key={slot.id}
                player={player}
                cost={getPlayerCost(player)}
                assignedPosition={slot.label}
                origin={{ club: player.club, season: formatSeasonLabel(player.season_year) }}
                hideRating={false}
              />
            );
          })}
        </div>
      )}

      <p className={`sim-status ${gamePhase === 'finished' ? 'sim-status-done' : ''}`} style={{ marginBottom: '20px' }}>
        {gamePhase === 'finished'
          ? 'SEASON COMPLETE'
          : showTransferWindow
          ? 'TRANSFER WINDOW OPEN...'
          : 'SIMULATING...'}
      </p>

      {gamePhase === 'finished' && originalDraftAverages && (
        <div style={{ marginBottom: '24px' }}>
          <EndOfSeasonSummary
            leagueTable={leagueTable}
            yourRecord={yourRecord}
            originalAverages={originalDraftAverages}
            currentAverages={calculateTeamStats()}
            transferHistory={transferHistory}
          />
        </div>
      )}

      <p className="field-label">League Table</p>
      <div className="league-table" style={{ marginBottom: '24px' }}>
        <div className="league-table-header">
          <span className="lt-rank">#</span>
          <span className="lt-team">Team</span>
          <span className="lt-stat">P</span>
          <span className="lt-stat">GD</span>
          <span className="lt-stat">Pts</span>
        </div>
        {leagueTable.map((row, index) => {
          const isYourTeam = row.name === 'Your Team';
          const rowClass = isYourTeam
            ? `your-row your-row-${yourRowMovement}`
            : '';
          return (
            <div key={row.name} className={`league-table-row ${rowClass}`}>
              <span className="lt-rank">{index + 1}</span>
              <span className="lt-team">{row.name === 'Your Team' ? displayTeamName : row.name}</span>
              <span className="lt-stat">{row.played}</span>
              <span className="lt-stat">{row.goalsFor - row.goalsAgainst}</span>
              <span className="lt-stat lt-pts">{row.points}</span>
            </div>
          );
        })}
      </div>

      <p className="field-label">Match History</p>
      <div className="match-feed">
        {matchHistory
          .slice()
          .reverse()
          .map((match, index) => (
            <div key={index} className={`match-feed-row match-feed-${resultType(match)}`}>
              <span className="match-feed-md">MD{match.matchday}</span>
              <div className="match-feed-grid">
                <span className="match-feed-team match-feed-team-left">
                  {match.isHome ? displayTeamName : match.opponent}
                </span>
                <span className="match-feed-score-center">
                  {match.isHome ? match.yourGoals : match.theirGoals}
                  {' - '}
                  {match.isHome ? match.theirGoals : match.yourGoals}
                </span>
                <span className="match-feed-team match-feed-team-right">
                  {match.isHome ? match.opponent : displayTeamName}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Simulating;