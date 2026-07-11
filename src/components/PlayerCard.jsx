function PlayerCard({ player, cost }) {
  return (
    <div className="player-card">
      <h2 className="player-name">{player.player_name}</h2>

      <div className="position-badges">
        {player.positions.map((pos) => (
          <span key={pos} className="position-badge">{pos} </span>
        ))}
      </div>

      <p className="player-rating">Overall: {player.rating_overall}</p>
      {cost !== undefined && <p className="player-cost">£{cost}m</p>}
    </div>
  );
}

export default PlayerCard;