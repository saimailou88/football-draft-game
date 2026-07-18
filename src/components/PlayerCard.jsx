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
  tradeResult = null, // 'upgrade' | 'downgrade' | null
}) {
  const badgeLabel = assignedPosition || player.positions.join('/');
  const category = unavailable ? 'unavailable' : getPositionCategory(assignedPosition || player.positions[0]);

  let tradeClass = '';
  if (tradeResult === 'upgrade') tradeClass = 'trade-upgrade';
  if (tradeResult === 'downgrade') tradeClass = 'trade-downgrade';

  return (
    <div className={`player-card ${category} ${tradeClass}`}>
      <div className="rating">{hideRating ? '??' : player.rating_overall}</div>
      <div className="info">
        <div className="name">{player.player_name}</div>
        <div className="sub-row">
          <span className="pos-badge">{badgeLabel}</span>
          {origin && (
            <span className="meta">{origin.club} · {origin.season}</span>
          )}
        </div>
      </div>
      {cost !== undefined && <div className="price">£{cost}M</div>}
    </div>
  );
}

export default PlayerCard;