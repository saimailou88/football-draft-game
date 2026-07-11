function convertZScoreToRating (zScore) {
    return 70 + zScore * 8;
}

function getGoalsForGap(gap) {
    let possibleGoals;
    
    if(gap >= 15) possibleGoals = [3, 4, 5];
    else if(gap >= 10) possibleGoals = [2, 3, 4];
    else if(gap >= 5) possibleGoals = [1, 2, 3];
    else if(gap >= 0) possibleGoals = [0, 1, 2];
    else if(gap >= -5) possibleGoals = [0, 1];
    else if(gap >= -10) possibleGoals = [0, 0, 1];
    else possibleGoals = [0, 0, 1];

    const randomIndex = Math.floor(Math.random() * possibleGoals.length);
    return possibleGoals[randomIndex];
}

export function simulateMatch(yourStats, opponent, isHome) {
    const theirAttack = convertZScoreToRating(opponent.attack_rating);
    const theirDefence = convertZScoreToRating(opponent.defence_rating);

    let yourGap = yourStats.fwd - theirDefence;
    if (yourStats.mid > theirDefence) yourGap += 3;
    if (isHome) yourGap += 4 
    const yourGoals = getGoalsForGap(yourGap);

    let theirGap = theirAttack - yourStats.def;
    if (!isHome) theirGap += 4;
    const theirGoals = getGoalsForGap(theirGap);

    return {yourGoals, theirGoals};
}

export function generateFixtures(opponents) {
    const fixtures = [];

    opponents.forEach((opponent) => {
        fixtures.push({opponent, isHome: true});
        fixtures.push({opponent, isHome: false})
    });

    for (let i =fixtures.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fixtures[i], fixtures [j]] = [fixtures[j], fixtures[i]]
    }

    return fixtures;
}

export function simulateSeason(yourStats, opponents) {
    const fixtures = generateFixtures(opponents);

    const table = {};
    table["YOUR_TEAM"] = {name: "Your Team", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    opponents.forEach((opp) => {
        table[opp.team] = { name: opp.team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
});
 const matchResults = [];

  fixtures.forEach(({ opponent, isHome }) => {
    const { yourGoals, theirGoals } = simulateMatch(yourStats, opponent, isHome);

    matchResults.push({
      opponent: opponent.team,
      isHome,
      yourGoals,
      theirGoals,
    });

    // Update your team's record
    const you = table["YOUR_TEAM"];
    const them = table[opponent.team];

    you.played += 1;
    them.played += 1;
    you.goalsFor += yourGoals;
    you.goalsAgainst += theirGoals;
    them.goalsFor += theirGoals;
    them.goalsAgainst += yourGoals;

    if (yourGoals > theirGoals) {
      you.won += 1;
      you.points += 3;
      them.lost += 1;
    } else if (yourGoals < theirGoals) {
      them.won += 1;
      them.points += 3;
      you.lost += 1;
    } else {
      you.drawn += 1;
      them.drawn += 1;
      you.points += 1;
      them.points += 1;
    }
  });

  // Convert table object into a sorted array (points, then goal difference)
  const sortedTable = Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goalsFor - a.goalsAgainst;
    const bGD = b.goalsFor - b.goalsAgainst;
    return bGD - aGD;
  });

  return { matchResults, table: sortedTable };
}