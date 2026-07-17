// Maps a position label to which color-coded card style it gets.
// Falls back to 'mid' for anything unrecognized so nothing renders unstyled.
function getPositionCategory(position) {
  if (position === 'GK') return 'gk';
  if (['CB', 'LB', 'RB'].includes(position)) return 'def';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(position)) return 'mid';
  if (['LW', 'RW', 'ST'].includes(position)) return 'att';
  return 'mid';
}

function PlayerCard({
  player,
  cost,
  assignedPosition,
  origin,
  hideRating = false,
  unavailable = false,
  transferred = false,
}) {
  const badgeLabel = assignedPosition || player.positions.join('/');

  let category;
  if (unavailable) category = 'unavailable';
  else if (transferred) category = 'transferred';
  else category = getPositionCategory(assignedPosition || player.positions[0]);

  return (
    <div className={`player-card ${category}`}>
      <div className="rating">{hideRating ? '??' : player.rating_overall}</div>
      <div className="pos-badge">{badgeLabel}</div>
      <div className="info">
        <div className="name">{player.player_name}</div>
        {origin && (
          <div className="meta">{origin.club} · {origin.season}</div>
        )}
      </div>
      {cost !== undefined && <div className="price">£{cost}M</div>}
    </div>
  );
}

export default PlayerCard;