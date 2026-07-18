import { useState } from 'react';
import {
  generateTransferOffers,
  pickRandomOffer,
  applyTransfer,
  removeOfferFromPool,
  calculateSlotAverages,
} from '../data/transferWindow';

function formatSeasonLabel(season) {
  const nextYearShort = (season + 1).toString().slice(-2);
  return `${season}-${nextYearShort}`;
}

function round1(value) {
  return Math.round(value);
}

function getPositionCategory(position) {
  if (position === 'GK') return 'gk';
  if (['CB', 'LB', 'RB'].includes(position)) return 'def';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(position)) return 'mid';
  if (['LW', 'RW', 'ST'].includes(position)) return 'att';
  return 'mid';
}

// Single compact row: position badge -> your player (rating) -> arrow ->
// offered player (rating) stacked above its club · season, all on one
// horizontal line (no-wrap) so nothing drops to a second row.
export function TransferRow({ offer, hideRating, highlighted, resultClass }) {
  const category = getPositionCategory(offer.slotLabel);
  const replacementRatingText = offer.replacement
    ? (hideRating ? '??' : offer.replacement.rating_overall)
    : null;

  return (
    <div className={`transfer-row ${highlighted ? 'transfer-row-highlight' : ''} ${resultClass || ''}`}>
      <div className="transfer-row-grid">
        <div className="transfer-row-your-col">
          <span className={`transfer-row-pos pos-badge-${category}`}>{offer.slotLabel}</span>
          <span className="transfer-row-your">
            {offer.outgoingPlayer.player_name} ({offer.outgoingPlayer.rating_overall})
          </span>
        </div>
        <span className="transfer-row-arrow">→</span>
        {offer.replacement ? (
          <div className="transfer-row-offered-col">
            <span className="transfer-row-offered">
              {offer.replacement.player_name} ({replacementRatingText})
            </span>
            <span className="transfer-row-meta">
              {offer.replacement.club} · {formatSeasonLabel(offer.replacement.season_year)}
            </span>
          </div>
        ) : (
          <span className="transfer-row-offered transfer-row-none">No eligible replacement</span>
        )}
      </div>
    </div>
  );
}

export default function TransferWindow({
  draftedSlots,
  formationSlots,
  allPlayers,
  draftedPlayerNames,
  positionCategory,
  hideRating = false,
  onComplete,
}) {
  const [offerPool, setOfferPool] = useState(() =>
    generateTransferOffers(draftedSlots, formationSlots, allPlayers, draftedPlayerNames)
  );
  const [currentSlots, setCurrentSlots] = useState(draftedSlots);
  const [transferHistory, setTransferHistory] = useState([]); // every completed swap this window, oldest first
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);

  const beforeAverages = calculateSlotAverages(draftedSlots, formationSlots, positionCategory);
  const currentAverages = calculateSlotAverages(currentSlots, formationSlots, positionCategory);

  function handleTransferClick() {
    if (offerPool.length === 0 || isSpinning) return;

    // Decide the real outcome immediately -- the highlight animation below
    // is purely visual, always landing on this pre-decided offer.
    const { chosenOffer, chosenIndex } = pickRandomOffer(offerPool);

    setIsSpinning(true);
    let tick = 0;
    const totalTicks = 12;

    const interval = setInterval(() => {
      tick++;
      if (tick >= totalTicks) {
        clearInterval(interval);
        setHighlightedIndex(chosenIndex);

        setTimeout(() => {
          const updatedSlots = applyTransfer(currentSlots, chosenOffer);
          setCurrentSlots(updatedSlots);
          setTransferHistory((prev) => [...prev, chosenOffer]);
          setOfferPool(removeOfferFromPool(offerPool, chosenIndex));
          setIsSpinning(false);
          setHighlightedIndex(null);
        }, 400);
      } else {
        setHighlightedIndex(Math.floor(Math.random() * offerPool.length));
      }
    }, 80);
  }

  function handleNoMoreTransfers() {
    onComplete(currentSlots, transferHistory);
  }

  return (
    <div className="draft-popup-overlay">
      <div className="draft-popup-modal">
        <h2 className="draft-popup-title">TRANSFER WINDOW</h2>
        <p className="field-subtext" style={{ textAlign: 'left', marginBottom: '20px' }}>
          MATCHDAY 20 · {offerPool.length} OFFER{offerPool.length !== 1 ? 'S' : ''} REMAINING
        </p>

        {/* Team average stats always show real numbers, in every difficulty --
            an aggregate GK/DEF/MID/FWD/OVR figure doesn't reveal any one
            player's identity, so hiding it here added friction with no
            real mystery. Each row is colored by its own direction. */}
        <p className="field-label">Squad Averages</p>
        <div className="tw-averages" style={{ marginBottom: '24px' }}>
          <AverageStat label="GK" before={beforeAverages.gk} current={currentAverages.gk} />
          <AverageStat label="DEF" before={beforeAverages.def} current={currentAverages.def} />
          <AverageStat label="MID" before={beforeAverages.mid} current={currentAverages.mid} />
          <AverageStat label="FWD" before={beforeAverages.fwd} current={currentAverages.fwd} />
          <AverageStat
            label="OVR"
            before={beforeAverages.overall}
            current={currentAverages.overall}
            highlight
          />
        </div>

        {transferHistory.length > 0 && (
          <>
            <p className="field-label">Completed Transfers</p>
            <div className="tw-row-list" style={{ marginBottom: '24px' }}>
              {transferHistory.map((offer, index) => {
                const isUpgrade = offer.replacement.rating_overall > offer.outgoingPlayer.rating_overall;
                const isDowngrade = offer.replacement.rating_overall < offer.outgoingPlayer.rating_overall;
                const resultClass = isUpgrade ? 'transfer-row-upgrade' : isDowngrade ? 'transfer-row-downgrade' : '';
                return (
                  <TransferRow key={index} offer={offer} hideRating={false} resultClass={resultClass} />
                );
              })}
            </div>
          </>
        )}

        <p className="field-label">Offers</p>
        <div className="tw-row-list" style={{ marginBottom: '24px' }}>
          {offerPool.length === 0 ? (
            <p className="no-slot-text">No offers remaining.</p>
          ) : (
            offerPool.map((offer, index) => (
              <TransferRow
                key={offer.slotId}
                offer={offer}
                hideRating={hideRating}
                highlighted={highlightedIndex === index}
              />
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-dark"
            style={{ flex: 1 }}
            onClick={handleNoMoreTransfers}
          >
            NO MORE TRANSFERS
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleTransferClick}
            disabled={offerPool.length === 0 || isSpinning}
          >
            {isSpinning ? 'SELECTING...' : 'TRANSFER'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AverageStat({ label, before, current, highlight }) {
  if (before === null || current === null) return null;

  const delta = round1(current - before);
  const deltaDisplay = delta === 0 ? '' : ` (${delta > 0 ? '+' : ''}${delta})`;
  const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : '';

  // Every row -- not just OVR -- reflects its own direction: green text if
  // that position group improved, red if it dropped.
  let directionClass = '';
  if (delta > 0) directionClass = 'tw-stat-up';
  else if (delta < 0) directionClass = 'tw-stat-down';

  const rowClass = `tw-stat-row ${highlight ? 'tw-stat-highlight' : ''} ${directionClass}`.trim();

  return (
    <div className={rowClass}>
      <span className="tw-stat-label">{label}</span>
      <span className="tw-stat-value">
        {round1(before)}
        <span className={`tw-stat-delta ${deltaClass}`}>{deltaDisplay}</span>
        {delta !== 0 && <span className="tw-stat-current"> → {round1(current)}</span>}
      </span>
    </div>
  );
}