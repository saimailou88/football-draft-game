// --- Converting a real team's Z-score rating into the same 0-100 scale as your squad ---
function convertZScoreToRating(zScore) {
  return 78 + zScore * 8;
}

// --- Turning a rating gap into an actual goal count ---
function getGoalsForGap(gap) {
  let possibleGoals;

  if (gap >= 15) possibleGoals = [3, 4, 5];
  else if (gap >= 10) possibleGoals = [2, 3, 4];
  else if (gap >= 5) possibleGoals = [1, 2, 3];
  else if (gap >= 0) possibleGoals = [0, 1, 2];
  else if (gap >= -5) possibleGoals = [0, 1];
  else if (gap >= -10) possibleGoals = [0, 0, 1];
  else possibleGoals = [0, 0, 1];

  const randomIndex = Math.floor(Math.random() * possibleGoals.length);
  return possibleGoals[randomIndex];
}

// --- Simulating one match ---
export function simulateMatch(yourStats, opponent, isHome) {
  const theirAttack = convertZScoreToRating(opponent.attack_rating);
  const theirDefence = convertZScoreToRating(opponent.defence_rating);

  let yourGap = yourStats.fwd - theirDefence;
  if (yourStats.mid > theirDefence) yourGap += 3;
  if (isHome) yourGap += 4;
  const yourGoals = getGoalsForGap(yourGap);

  let theirGap = theirAttack - yourStats.def;
  if (!isHome) theirGap += 4;
  const theirGoals = getGoalsForGap(theirGap);

  return { yourGoals, theirGoals };
}

// --- Generating a full season's fixtures (home + away vs every opponent, shuffled) ---
export function generateFixtures(opponents) {
  const fixtures = [];

  opponents.forEach((opponent) => {
    fixtures.push({ opponent, isHome: true });
    fixtures.push({ opponent, isHome: false });
  });

  for (let i = fixtures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
  }

  return fixtures;
}

// --- Tracking YOUR team's record ---
export function createEmptyYourRecord() {
  return { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

export function applyResultToYourRecord(record, yourGoals, theirGoals) {
  const updated = { ...record };
  updated.played += 1;
  updated.goalsFor += yourGoals;
  updated.goalsAgainst += theirGoals;

  if (yourGoals > theirGoals) {
    updated.won += 1;
    updated.points += 3;
  } else if (yourGoals < theirGoals) {
    updated.lost += 1;
  } else {
    updated.drawn += 1;
    updated.points += 1;
  }

  return updated;
}

// --- Tracking each opponent's supplemental record from playing against you ---
export function createEmptyOpponentSupplement() {
  return {}; // { teamName: { played, goalsFor, goalsAgainst, points } }
}

export function applyResultToOpponentSupplement(supplement, opponentName, yourGoals, theirGoals) {
  const updated = { ...supplement };
  const current = updated[opponentName] || { played: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };

  const newEntry = { ...current };
  newEntry.played += 1;
  newEntry.goalsFor += theirGoals; // from the opponent's own perspective
  newEntry.goalsAgainst += yourGoals;

  if (theirGoals > yourGoals) newEntry.points += 3;
  else if (theirGoals === yourGoals) newEntry.points += 1;

  updated[opponentName] = newEntry;
  return updated;
}

// --- Building the table: real historical stats (scaled by progress) + supplement from games vs you ---
export function buildProgressiveTable(opponents, yourRecord, opponentSupplement, currentMatchday, totalMatchdays) {
  const progress = totalMatchdays > 0 ? currentMatchday / totalMatchdays : 0;

  const table = opponents.map((opp) => {
    const scaledGoalsFor = Math.round(opp.goals_for * progress);
    const scaledGoalsAgainst = Math.round(opp.goals_against * progress);
    const scaledPlayed = Math.round(38 * progress);
    const scaledPoints = Math.round(opp.points * progress);

    const supplement = opponentSupplement[opp.team] || { played: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };

    const goalsFor = scaledGoalsFor + supplement.goalsFor;
    const goalsAgainst = scaledGoalsAgainst + supplement.goalsAgainst;

    return {
      name: opp.team,
      played: scaledPlayed + supplement.played,
      points: scaledPoints + supplement.points,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
    };
  });

  table.push({
    name: "Your Team",
    played: yourRecord.played,
    points: yourRecord.points,
    goalsFor: yourRecord.goalsFor,
    goalsAgainst: yourRecord.goalsAgainst,
    goalDiff: yourRecord.goalsFor - yourRecord.goalsAgainst,
  });

  return table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDiff - a.goalDiff;
  });
}