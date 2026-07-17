function Homepage({ onPlayClick, onHowToPlayClick }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '40px 24px',
      gap: '16px'
    }}>
      <h1 className="game-title">THE DUGOUT</h1>

      <p className="label-mono" style={{ marginBottom: '48px' }}>
        DRAFT A SQUAD AND WIN THE TITLE.
      </p>

      <button className="btn btn-dark" onClick={onHowToPlayClick} style={{ width: '100%' }}>
        HOW TO PLAY
      </button>

      <button className="btn btn-primary" onClick={onPlayClick} style={{ width: '100%' }}>
        PLAY PREM
      </button>

      <p className="label-mono" style={{ color: 'var(--grey-text)', opacity: 0.5, marginTop: '24px' }}>
        MORE GAME MODES COMING SOON...
      </p>
    </div>
  );
}

export default Homepage;