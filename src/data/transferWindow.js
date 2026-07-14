// --- Calculates GK/DEF/MID/FWD/Overall averages for a given draftedSlots object ---
export function calculateSlotAverages(draftedSlots, formationSlots, positionCategory) {
  const groupTotals = { GK: [], DEF: [], MID: [], FWD: [] };

  Object.entries(draftedSlots).forEach(([slotId, player]) => {
    const slotDef = formationSlots.find((s) => s.id === slotId);
    if (!slotDef) return;
    const category = positionCategory[slotDef.label];
    if (category) groupTotals[category].push(player.rating_overall);
  });

  const average = (arr) =>
    arr.length > 0 ? arr.reduce((sum, r) => sum + r, 0) / arr.length : null;
  const allRatings = Object.values(draftedSlots).map((p) => p.rating_overall);

  return {
    gk: average(groupTotals.GK),
    def: average(groupTotals.DEF),
    mid: average(groupTotals.MID),
    fwd: average(groupTotals.FWD),
    overall: average(allRatings),
  };
}

// --- Picks 5 random slot IDs from the drafted squad to receive a transfer offer ---
function pickRandomSlotIds(slotIds, count) {
  const pool = [...slotIds];
  const chosen = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    chosen.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }
  return chosen;
}

// =====================================================================
// TIER SYSTEM
// Each offer in the window is assigned a TIER, defined as a rating delta
// range relative to the OUTGOING player's own rating (not an absolute
// band). This means "very high" always means a real, meaningful upgrade
// for that specific player, and "bad" always means a real downgrade --
// regardless of whether the outgoing player happens to be a 55 or an 85.
// =====================================================================

const TIERS = {
  veryHigh: { min: 15, max: 25 },   // a genuine star upgrade
  good: { min: 5, max: 14 },        // a solid, noticeable upgrade
  mediocre: { min: -4, max: 4 },    // roughly a sidegrade either way
  bad: { min: -25, max: -5 },       // a real downgrade
};

// Each pattern is the "shape" of one full 5-offer batch. A pattern is
// picked once per transfer window, then its 5 tiers are shuffled across
// the 5 chosen slots -- so the big upgrade isn't always offer #1.
const PATTERNS = [
  ['veryHigh', 'bad', 'bad', 'bad', 'bad'],
  ['good', 'good', 'bad', 'bad', 'bad'],
  ['veryHigh', 'good', 'bad', 'bad', 'bad'],
  ['good', 'mediocre', 'bad', 'bad', 'bad'],
  ['veryHigh', 'mediocre', 'bad', 'bad', 'bad'],
  ['good', 'bad', 'bad', 'bad', 'bad'],
];

function pickRandomPattern() {
  return PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
}

// Fisher-Yates shuffle, so a pattern's tiers land on random slots each time
// rather than always in the same order they're listed above.
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// --- Finds a replacement matching a specific tier's target rating range ---
// Tries the exact tier range first. If nothing qualifies (e.g. "very high"
// for an outgoing player already rated 95 has nowhere to go, since ratings
// cap at 97), it progressively widens the search rather than failing
// outright, so a tier always returns SOMETHING rather than silently
// falling back to fully random.
function getReplacementForTier(slotLabel, outgoingRating, tier, allPlayers, excludedNames) {
  const eligiblePool = allPlayers.filter(
    (p) => p.positions.includes(slotLabel) && !excludedNames.includes(p.player_name)
  );
  if (eligiblePool.length === 0) return null;

  const tierRange = TIERS[tier];
  let widen = 0;

  // Widen the target window in 5-point steps (up to +/-20 extra) until at
  // least one real candidate is found, rather than ever returning nothing.
  while (widen <= 20) {
    const targetMin = outgoingRating + tierRange.min - widen;
    const targetMax = outgoingRating + tierRange.max + widen;
    const candidates = eligiblePool.filter(
      (p) => p.rating_overall >= targetMin && p.rating_overall <= targetMax
    );
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    widen += 5;
  }

  // Last resort: whoever in the eligible pool is numerically closest to the
  // tier's target midpoint. Only reached in edge cases (e.g. a position
  // with very few players in the whole dataset).
  const targetMid = outgoingRating + (tierRange.min + tierRange.max) / 2;
  return eligiblePool.reduce((closest, player) =>
    Math.abs(player.rating_overall - targetMid) < Math.abs(closest.rating_overall - targetMid)
      ? player
      : closest
  );
}

// --- Builds the initial pool of 5 transfer offers when the window opens ---
// Picks a random pattern (the "shape" of the batch), shuffles which slot
// gets which tier, then fills each slot's offer using that tier's target
// rating range relative to the outgoing player.
export function generateTransferOffers(draftedSlots, formationSlots, allPlayers, draftedPlayerNames) {
  const slotIds = pickRandomSlotIds(Object.keys(draftedSlots), 5);
  const tiers = shuffleArray(pickRandomPattern());
  const excludedNames = [...draftedPlayerNames];

  return slotIds.map((slotId, index) => {
    const slotDef = formationSlots.find((s) => s.id === slotId);
    const outgoingPlayer = draftedSlots[slotId];
    const tier = tiers[index];
    const replacement = getReplacementForTier(
      slotDef.label,
      outgoingPlayer.rating_overall,
      tier,
      allPlayers,
      excludedNames
    );
    if (replacement) excludedNames.push(replacement.player_name);
    return { slotId, slotLabel: slotDef.label, outgoingPlayer, replacement, tier };
  });
}

// --- "Random line picker": selects one offer at random from whatever's left ---
export function pickRandomOffer(remainingOffers) {
  const randomIndex = Math.floor(Math.random() * remainingOffers.length);
  return { chosenOffer: remainingOffers[randomIndex], chosenIndex: randomIndex };
}

// --- Applies a chosen offer: swaps the replacement into the squad slot ---
export function applyTransfer(draftedSlots, offer) {
  if (!offer.replacement) return draftedSlots;
  return { ...draftedSlots, [offer.slotId]: offer.replacement };
}

// --- Removes the just-used offer from the remaining pool ---
export function removeOfferFromPool(remainingOffers, chosenIndex) {
  const updated = [...remainingOffers];
  updated.splice(chosenIndex, 1);
  return updated;
}