function PlayerCard({ player, cost, assignedPosition, origin }) {
  return (
    <div className="player-card">
      <h2 className="player-name">{player.player_name}</h2>

      {assignedPosition ? (
        <p className="player-position">{assignedPosition}</p>
      ) : (
        <div className="position-badges">
          {player.positions.map((pos) => (
            <span key={pos} className="position-badge">{pos} </span>
          ))}
        </div>
      )}

      <p className="player-rating">Overall: {player.rating_overall}</p>
      {cost !== undefined && <p className="player-cost">£{cost}m</p>}

      {origin && (
        <p className="player-origin" style={{ fontSize: '0.75em', color: '#888' }}>
          {origin.club} · {origin.season}
        </p>
      )}
    </div>
  );
}

export default PlayerCard;