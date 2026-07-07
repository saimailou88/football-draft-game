function PlayerCard({player}) {
    return (
        <div className="player-card">
            <h2 className="player-name">{player.player_name}</h2>
            <p className="player-club">{player.club} · {player.season_year}</p>

      <div className="position-badges">
        {player.positions.map((pos) => (
          <span key={pos} className="position-badge">{pos}</span>
        ))}
      </div>

      <p className="player-rating">Overall: {player.rating_overall}</p>
    </div>
  );
}

export default PlayerCard;