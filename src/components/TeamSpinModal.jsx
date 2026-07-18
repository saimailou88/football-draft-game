import { useEffect } from 'react';
import PlayerCard from './PlayerCard';

function TeamSpinModal({
  currentTeamSeason,
  currentSquad,
  selectedFormation,
  formations,
  draftedSlots,
  draftedPlayerNames,
  budgetRemaining,
  totalBudget,
  hideRating,
  teamRerollsLeft,
  getPlayerCost,
  getEligibleSlots,
  assignToSlot,
  handleTeamReroll,
  onDismiss,
  formatSeasonLabel,
}) {
  const openSlotLabels = formations[selectedFormation]
    .filter((slot) => !draftedSlots[slot.id])
    .map((slot) => slot.label);
  const uniqueOpenLabels = [...new Set(openSlotLabels)];

  const candidates = currentSquad.filter(
    (player) => !draftedPlayerNames.includes(player.player_name)
  );

  const sorted = candidates.slice().sort((a, b) => {
    const aFits = getEligibleSlots(a).length > 0 ? 1 : 0;
    const bFits = getEligibleSlots(b).length > 0 ? 1 : 0;
    if (aFits !== bFits) return bFits - aFits;

    const aAfford = getPlayerCost(a) <= budgetRemaining ? 1 : 0;
    const bAfford = getPlayerCost(b) <= budgetRemaining ? 1 : 0;
    if (aAfford !== bAfford) return bAfford - aAfford;

    return b.rating_overall - a.rating_overall;
  });

  // Stuck = no rerolls left AND nobody in this squad can actually be
  // picked (either unaffordable or no open matching slot). If so, the
  // pop-up closes itself automatically, dropping the player back to the
  // drafting screen where Restart Draft / New Game are reachable.
  const isStuck =
    teamRerollsLeft <= 0 &&
    (sorted.length === 0 || sorted.every((player) => getEligibleSlots(player).length === 0));

  useEffect(() => {
    if (isStuck) {
      onDismiss();
    }
  }, [isStuck]);

  if (isStuck) {
    // Render nothing this frame -- the useEffect above will close the
    // pop-up on the next tick, this just avoids a flash of dead-end content.
    return null;
  }

  return (
    <div className="draft-popup-overlay">
      <div className="draft-popup-modal">
        <h2 className="draft-popup-title">
          {currentTeamSeason.team} {formatSeasonLabel(currentTeamSeason.season)}
        </h2>
        <p
          className="field-subtext"
          style={{
            textAlign: 'left',
            marginBottom: '4px',
            fontWeight: 700,
            fontSize: '14px',
            color: 'var(--accent-purple)',
          }}
        >
          BUDGET: £{budgetRemaining}M / £{totalBudget}M
        </p>
        <p className="field-subtext" style={{ textAlign: 'left', marginBottom: '16px' }}>
          POSITIONS TO FILL: {uniqueOpenLabels.join(', ')}
        </p>

        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: '16px' }}
          onClick={handleTeamReroll}
          disabled={teamRerollsLeft <= 0}
        >
          REROLL ({teamRerollsLeft})
        </button>

        <div className="draft-popup-list">
          {sorted.map((player, index) => {
            const eligibleSlots = getEligibleSlots(player);
            const isUnavailable = eligibleSlots.length === 0;
            return (
              <div key={index} className="draft-popup-row">
                <PlayerCard
                  player={player}
                  cost={getPlayerCost(player)}
                  hideRating={hideRating}
                  unavailable={isUnavailable}
                />
                {isUnavailable ? (
                  <p className="no-slot-text">
                    {getPlayerCost(player) > budgetRemaining
                      ? "Can't afford"
                      : 'No open matching slot'}
                  </p>
                ) : (
                  <div className="eligible-slots">
                    {eligibleSlots.map((slot) => (
                      <button
                        key={slot.id}
                        className="formation-chip"
                        onClick={() => assignToSlot(player, slot.id)}
                      >
                        PLACE IN {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TeamSpinModal;