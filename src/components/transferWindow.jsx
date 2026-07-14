import { useState } from 'react';
import {
  generateTransferOffers,
  pickRandomOffer,
  applyTransfer,
  removeOfferFromPool,
  calculateSlotAverages,
} from '../data/transferWindow';

export default function TransferWindow({
  draftedSlots,
  formationSlots,
  allPlayers,
  draftedPlayerNames,
  positionCategory,
  onComplete,
}) {
  const [offerPool, setOfferPool] = useState(() =>
    generateTransferOffers(draftedSlots, formationSlots, allPlayers, draftedPlayerNames)
  );
  const [currentSlots, setCurrentSlots] = useState(draftedSlots);
  const [transferHistory, setTransferHistory] = useState([]); // every completed swap this window, oldest first
  const [isSpinning, setIsSpinning] = useState(false);

  const beforeAverages = calculateSlotAverages(draftedSlots, formationSlots, positionCategory);
  const currentAverages = calculateSlotAverages(currentSlots, formationSlots, positionCategory);

  function handleTransferClick() {
    if (offerPool.length === 0 || isSpinning) return;
    setIsSpinning(true);

    setTimeout(() => {
      const { chosenOffer, chosenIndex } = pickRandomOffer(offerPool);
      const updatedSlots = applyTransfer(currentSlots, chosenOffer);

      setCurrentSlots(updatedSlots);
      setTransferHistory((prev) => [...prev, chosenOffer]);
      setOfferPool(removeOfferFromPool(offerPool, chosenIndex));
      setIsSpinning(false);
    }, 600);
  }

  function handleNoMoreTransfers() {
    onComplete(currentSlots, transferHistory);
  }

  return (
    <div className="transfer-window-overlay">
      <div className="transfer-window-modal">
        <h2>Transfer Window — Matchday 20</h2>
        <p className="transfer-window-subtitle">
          {offerPool.length} offer{offerPool.length !== 1 ? 's' : ''} remaining
        </p>

        <div className="transfer-window-averages">
          <AverageStat label="GK" before={beforeAverages.gk} current={currentAverages.gk} />
          <AverageStat label="DEF" before={beforeAverages.def} current={currentAverages.def} />
          <AverageStat label="MID" before={beforeAverages.mid} current={currentAverages.mid} />
          <AverageStat label="FWD" before={beforeAverages.fwd} current={currentAverages.fwd} />
          <AverageStat
            label="OVERALL"
            before={beforeAverages.overall}
            current={currentAverages.overall}
            highlight
          />
        </div>

        {/* Every completed swap this window, not just the most recent one */}
        {transferHistory.length > 0 && (
          <div className="transfer-window-history">
            {transferHistory.map((offer, index) => (
              <p key={index} className="transfer-window-confirmation">
                {offer.slotLabel} slot updated: {offer.outgoingPlayer.player_name} (
                {offer.outgoingPlayer.rating_overall}) → {offer.replacement.player_name} (
                {offer.replacement.rating_overall})
              </p>
            ))}
          </div>
        )}

        <div className="transfer-window-offer-list">
          {offerPool.length === 0 ? (
            <p className="no-offers-left">No offers remaining.</p>
          ) : (
            offerPool.map((offer) => (
              <div key={offer.slotId} className="offer-row">
                <span className="offer-slot-label">{offer.slotLabel}</span>
                <span className="offer-outgoing">
                  {offer.outgoingPlayer.player_name} ({offer.outgoingPlayer.rating_overall})
                </span>
                <span className="offer-arrow">→</span>
                <span className="offer-incoming">
                  {offer.replacement
                    ? `${offer.replacement.player_name} (${offer.replacement.rating_overall})`
                    : 'No eligible replacement found'}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="transfer-window-buttons">
          <button
            className="transfer-button"
            onClick={handleTransferClick}
            disabled={offerPool.length === 0 || isSpinning}
          >
            {isSpinning ? 'Selecting...' : 'Transfer'}
          </button>
          <button className="no-transfer-button" onClick={handleNoMoreTransfers}>
            No More Transfers
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

  return (
    <div className={`average-stat-row ${highlight ? 'highlight' : ''}`}>
      <span className="average-stat-label">{label}</span>
      <span className="average-stat-value">
        {round1(before)}
        <span className={`average-stat-delta ${deltaClass}`}>{deltaDisplay}</span>
        {delta !== 0 && <span className="average-stat-current"> → {round1(current)}</span>}
      </span>
    </div>
  );
}

function round1(value) {
  return Math.round(value);
}