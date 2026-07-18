import { useState, useEffect } from 'react';
import { getHistory } from '../data/history';
import { TransferRow } from './transferWindow';
import PlayerCard from './PlayerCard';
import Footer from './Footer';
import teamsData from '../data/teams.json';

function formatSeasonLabel(season) {
  const nextYearShort = (season + 1).toString().slice(-2);
  return `${season}-${nextYearShort}`;
}

function round1(value) {
  return Math.round(value);
}

// Big headline number for the overall squad rating (draft day -> final),
// colored green/red if it moved, neutral white if unchanged.
function RatingChangeLine({ before, after }) {
  if (before === null || before === undefined || after === null || after === undefined) return null;
  const b = round1(before);
  const a = round1(after);

  let directionClass = '';
  if (a > b) directionClass = 'history-rating-up';
  else if (a < b) directionClass = 'history-rating-down';

  return (
    <p className={`history-rating-line ${directionClass}`}>
      {b} <span className="history-rating-arrow">→</span> {a}
    </p>
  );
}

// One GK/DEF/MID/FWD line. Shows a single number if the position group
// never changed, or a before -> after with a signed delta if it did.
function StatCompareLine({ label, before, after }) {
  if (before === null || before === undefined || after === null || after === undefined) return null;
  const b = round1(before);
  const a = round1(after);
  const delta = a - b;

  if (delta === 0) {
    return (
      <p className="history-stat-line">
        <span className="history-stat-label">{label}:</span> {b}
      </p>
    );
  }

  const directionClass = delta > 0 ? 'history-stat-up' : 'history-stat-down';
  return (
    <p className={`history-stat-line ${directionClass}`}>
      <span className="history-stat-label">{label}:</span> {b}
      <span className="history-stat-arrow">→</span> {a}
      <span className="history-stat-delta">({delta > 0 ? '+' : ''}{delta})</span>
    </p>
  );
}

function HistoryPage({ onBack }) {
  const [history, setHistory] = useState([]);
  const [expandedSeason, setExpandedSeason] = useState(null);

  // Loaded once on mount -- this screen is only ever visited between
  // games, so there's no live state to keep it in sync with.
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Every season the game supports, not just the ones played -- unplayed
  // seasons still show up in the list with an N/A rank, so the full
  // timeline is visible up front.
  const allSeasons = [...new Set(teamsData.map((t) => t.season))].sort((a, b) => a - b);

  const sorted = allSeasons.map((season) => {
    const played = history.find((e) => e.season_year === season);
    return played || { season_year: season, isUnplayed: true };
  });

  function toggleSeason(seasonYear) {
    // Accordion behavior: tapping the open row closes it, tapping a
    // different row closes whichever was open and opens the new one.
    setExpandedSeason((prev) => (prev === seasonYear ? null : seasonYear));
  }

  return (
    <div style={{ padding: '20px 24px 60px' }}>
      <button
        className="btn btn-dark"
        onClick={onBack}
        style={{ padding: '10px 16px', fontSize: '13px', marginBottom: '20px' }}
      >
        ← BACK
      </button>

      <h1 className="section-title" style={{ fontSize: '24px', marginBottom: '24px' }}>
        LEAGUE HISTORY
      </h1>

      <div className="history-list">
          {sorted.map((entry) => {
            const isExpanded = expandedSeason === entry.season_year;
            const isChampion = entry.final_position === 1;

            // Slots that were transferred this season -- used to hide the
            // price on those player cards, matching the same rule used
            // during live simulation.
            const transferredSlotIds = new Set(
              (entry.transferHistory || []).map((t) => t.slotId)
            );

            return (
              <div key={entry.season_year} className="history-entry">
                <div className="history-row" onClick={() => toggleSeason(entry.season_year)}>
                  <span className="history-season">{formatSeasonLabel(entry.season_year)}</span>
                  <span className={`history-rank ${isChampion ? 'history-rank-champion' : ''} ${entry.isUnplayed ? 'history-rank-unplayed' : ''}`}>
                    {entry.isUnplayed ? 'N/A' : `#${entry.final_position}`}
                  </span>
                  <span className="history-toggle">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && entry.isUnplayed && (
                  <div className="history-expanded">
                    <p className="no-slot-text">
                      Season not played yet — your best result for each season will show up here once you finish one.
                    </p>
                  </div>
                )}

                {isExpanded && !entry.isUnplayed && (
                  <div className="history-expanded">
                    <RatingChangeLine
                      before={entry.originalAverages?.overall}
                      after={entry.finalAverages?.overall}
                    />

                    <div className="history-wdl-row">
                      <div className="history-wdl-chip history-wdl-win">
                        <span className="history-wdl-value">{entry.record?.won ?? '–'}</span>
                        <span className="history-wdl-label">WON</span>
                      </div>
                      <div className="history-wdl-chip history-wdl-draw">
                        <span className="history-wdl-value">{entry.record?.drawn ?? '–'}</span>
                        <span className="history-wdl-label">DRAW</span>
                      </div>
                      <div className="history-wdl-chip history-wdl-loss">
                        <span className="history-wdl-value">{entry.record?.lost ?? '–'}</span>
                        <span className="history-wdl-label">LOSS</span>
                      </div>
                    </div>

                    <div className="history-stat-list">
                      <StatCompareLine label="GK" before={entry.originalAverages?.gk} after={entry.finalAverages?.gk} />
                      <StatCompareLine label="DEF" before={entry.originalAverages?.def} after={entry.finalAverages?.def} />
                      <StatCompareLine label="MID" before={entry.originalAverages?.mid} after={entry.finalAverages?.mid} />
                      <StatCompareLine label="FWD" before={entry.originalAverages?.fwd} after={entry.finalAverages?.fwd} />
                    </div>

                    <p className="field-label" style={{ marginTop: '16px' }}>Transfers</p>
                    {(!entry.transferHistory || entry.transferHistory.length === 0) ? (
                      <p className="no-slot-text">No transfers made.</p>
                    ) : (
                      <div className="tw-row-list" style={{ marginBottom: '8px' }}>
                        {entry.transferHistory.map((offer, i) => {
                          const isUpgrade = offer.replacement.rating_overall > offer.outgoingPlayer.rating_overall;
                          const isDowngrade = offer.replacement.rating_overall < offer.outgoingPlayer.rating_overall;
                          const resultClass = isUpgrade ? 'transfer-row-upgrade' : isDowngrade ? 'transfer-row-downgrade' : '';
                          return (
                            <TransferRow key={i} offer={offer} hideRating={false} resultClass={resultClass} />
                          );
                        })}
                      </div>
                    )}

                    <div className="history-divider" />

                    <p className="history-team-name">{entry.team_name}</p>
                    <p className="history-meta-line">{entry.formation} · £{entry.budget}M</p>
                    
                    <div className="slot-list" style={{ marginTop: '12px' }}>
                      {(entry.finalSquad || []).map((item) => (
                        <PlayerCard
                          key={item.slotId}
                          player={item.player}
                          cost={transferredSlotIds.has(item.slotId) ? undefined : item.cost}
                          assignedPosition={item.slotLabel}
                          origin={{
                            club: item.player.club,
                            season: formatSeasonLabel(item.player.season_year),
                          }}
                          hideRating={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      <Footer />
    </div>
  );
}

export default HistoryPage;