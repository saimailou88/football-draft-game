// Hand-placed layout per formation, matching the reference app's pitch
// diagrams exactly rather than calculating position from labels. Each
// entry is { top, left } as a % of the pitch box. slot.id must match
// the ids used in formations.js for that formation.
const LAYOUTS = {
  "4-4-2": {
    gk: { top: 92, left: 50 },
    lb: { top: 74, left: 15 }, cb1: { top: 77, left: 38 }, cb2: { top: 77, left: 62 }, rb: { top: 74, left: 85 },
    lm: { top: 44, left: 15 }, cm1: { top: 44, left: 38 }, cm2: { top: 44, left: 62 }, rm: { top: 44, left: 85 },
    st1: { top: 16, left: 38 }, st2: { top: 16, left: 62 },
  },
  "4-3-3": {
    gk: { top: 92, left: 50 },
    lb: { top: 74, left: 15 }, cb1: { top: 77, left: 38 }, cb2: { top: 77, left: 62 }, rb: { top: 74, left: 85 },
    cm1: { top: 44, left: 33 }, cdm: { top: 54, left: 50 }, cm2: { top: 44, left: 67 },
    lw: { top: 20, left: 15 }, rw: { top: 20, left: 85 }, st: { top: 15, left: 50 },
  },
  "3-5-2": {
    gk: { top: 92, left: 50 },
    cb1: { top: 78, left: 27 }, cb2: { top: 80, left: 50 }, cb3: { top: 78, left: 73 },
    lm: { top: 44, left: 10 }, cm1: { top: 44, left: 35 }, cdm: { top: 54, left: 50 }, cm2: { top: 44, left: 65 }, rm: { top: 44, left: 90 },
    st1: { top: 16, left: 38 }, st2: { top: 16, left: 62 },
  },
  "4-2-3-1": {
    gk: { top: 92, left: 50 },
    lb: { top: 74, left: 15 }, cb1: { top: 77, left: 38 }, cb2: { top: 77, left: 62 }, rb: { top: 74, left: 85 },
    cdm1: { top: 54, left: 38 }, cdm2: { top: 54, left: 62 },
    cam: { top: 38, left: 50 },
    lw: { top: 24, left: 15 }, rw: { top: 24, left: 85 }, st: { top: 15, left: 50 },
  },
  "4-5-1": {
    gk: { top: 92, left: 50 },
    lb: { top: 74, left: 15 }, cb1: { top: 77, left: 38 }, cb2: { top: 77, left: 62 }, rb: { top: 74, left: 85 },
    lm: { top: 44, left: 15 }, cm1: { top: 44, left: 38 }, cdm: { top: 54, left: 50 }, cm2: { top: 44, left: 62 }, rm: { top: 44, left: 85 },
    st: { top: 15, left: 50 },
  },
  "3-4-3": {
    gk: { top: 94, left: 50 },
    cb1: { top: 80, left: 25 }, cb2: { top: 83, left: 50 }, cb3: { top: 80, left: 75 },
    lm: { top: 44, left: 10 }, cm1: { top: 44, left: 35 }, cm2: { top: 44, left: 65 }, rm: { top: 44, left: 90 },
    lw: { top: 20, left: 15 }, rw: { top: 20, left: 85 }, st: { top: 15, left: 50 },
  },
  "5-3-2": {
    gk: { top: 92, left: 50 },
    lb: { top: 74, left: 10 }, cb1: { top: 78, left: 30 }, cb2: { top: 80, left: 50 }, cb3: { top: 78, left: 70 }, rb: { top: 74, left: 90 },
    cm1: { top: 44, left: 35 }, cdm: { top: 54, left: 50 }, cm2: { top: 44, left: 65 },
    st1: { top: 16, left: 38 }, st2: { top: 16, left: 62 },
  },
  "4-1-4-1": {
    gk: { top: 92, left: 50 },
    lb: { top: 74, left: 15 }, cb1: { top: 77, left: 38 }, cb2: { top: 77, left: 62 }, rb: { top: 74, left: 85 },
    cdm: { top: 54, left: 50 },
    lm: { top: 38, left: 15 }, cm1: { top: 38, left: 38 }, cm2: { top: 38, left: 62 }, rm: { top: 38, left: 85 },
    st: { top: 15, left: 50 },
  },
  "4-4-1-1": {
    gk: { top: 92, left: 50 },
    lb: { top: 74, left: 15 }, cb1: { top: 77, left: 38 }, cb2: { top: 77, left: 62 }, rb: { top: 74, left: 85 },
    lm: { top: 44, left: 15 }, cm1: { top: 44, left: 38 }, cm2: { top: 44, left: 62 }, rm: { top: 44, left: 85 },
    cam: { top: 30, left: 50 },
    st: { top: 15, left: 50 },
  },
  "3-4-2-1": {
    gk: { top: 92, left: 50 },
    cb1: { top: 80, left: 25 }, cb2: { top: 83, left: 50 }, cb3: { top: 80, left: 75 },
    lm: { top: 44, left: 10 }, cm1: { top: 44, left: 35 }, cm2: { top: 44, left: 65 }, rm: { top: 44, left: 90 },
    cam1: { top: 28, left: 35 }, cam2: { top: 28, left: 65 },
    st: { top: 15, left: 50 },
  },
};

// Fallback for any formation not in LAYOUTS above -- spreads slots evenly
// by label so nothing breaks.
const FALLBACK_ROW_TOP = {
  GK: 92,
  LB: 74, CB: 77, RB: 74,
  CDM: 54,
  CM: 44, LM: 44, RM: 44,
  CAM: 30,
  LW: 18, RW: 18, ST: 15,
};

function getFallbackLayout(formationSlots) {
  const rows = {};
  formationSlots.forEach((slot) => {
    const top = FALLBACK_ROW_TOP[slot.label] ?? 50;
    if (!rows[top]) rows[top] = [];
    rows[top].push(slot);
  });

  const positioned = [];
  Object.entries(rows).forEach(([top, rowSlots]) => {
    const count = rowSlots.length;
    rowSlots.forEach((slot, index) => {
      const left = count === 1 ? 50 : 12 + (index / (count - 1)) * 76;
      positioned.push({ ...slot, top: Number(top), left });
    });
  });

  return positioned;
}

function getPitchLayout(formationName, formationSlots) {
  const layout = LAYOUTS[formationName];
  if (!layout) return getFallbackLayout(formationSlots);

  return formationSlots.map((slot) => ({
    ...slot,
    top: layout[slot.id]?.top ?? 50,
    left: layout[slot.id]?.left ?? 50,
  }));
}

// Maps a position label to the same color categories used on player cards,
// so a filled pitch dot matches the color of that player's card below.
function getPositionCategory(position) {
  if (position === 'GK') return 'gk';
  if (['CB', 'LB', 'RB'].includes(position)) return 'def';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(position)) return 'mid';
  if (['LW', 'RW', 'ST'].includes(position)) return 'att';
  return 'mid';
}

// Turns a full name into a short initial for the pitch dot,
// e.g. "Nathan Collins" -> "N.C". Falls back gracefully for single-word names.
function getInitials(playerName) {
  const parts = playerName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}.${last}`.toUpperCase();
}

function PitchPreview({ formationName, formationSlots, draftedSlots = {}, transferredSlotIds }) {
  const layout = getPitchLayout(formationName, formationSlots);

  function isTransferred(slotId) {
    if (!transferredSlotIds) return false;
    return transferredSlotIds.has ? transferredSlotIds.has(slotId) : transferredSlotIds.includes(slotId);
  }

  return (
    <div className="pitch-preview">
      {layout.map((slot) => {
        const player = draftedSlots[slot.id];
        if (player) {
          const category = isTransferred(slot.id) ? 'transferred' : getPositionCategory(slot.label);
          return (
            <div
              key={slot.id}
              className={`pitch-dot pitch-dot-filled pitch-dot-${category}`}
              style={{ top: `${slot.top}%`, left: `${slot.left}%` }}
            >
              {getInitials(player.player_name)}
            </div>
          );
        }
        return (
          <div
            key={slot.id}
            className="pitch-dot"
            style={{ top: `${slot.top}%`, left: `${slot.left}%` }}
          >
            {slot.label}
          </div>
        );
      })}
    </div>
  );
}

export default PitchPreview;