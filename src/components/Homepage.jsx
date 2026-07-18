import Footer from './Footer';

function Homepage({ onPlayClick, onHowToPlayClick, onHistoryClick }) {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '40px 24px',
      gap: '16px'
    }}>
      <button
        className="btn btn-dark"
        onClick={onHistoryClick}
        style={{ position: 'absolute', top: '20px', right: '24px', padding: '10px 16px', fontSize: '13px' }}
      >
        GAME HISTORY
      </button>

      <h1 className="game-title">THE DUGOUT</h1>

      <p className="label-mono" style={{ marginBottom: '48px' }}>
        DRAFT HISTORY. MANAGE THE UNPREDICTABLE.
      </p>

      <button className="btn btn-dark" onClick={onHowToPlayClick} style={{ width: '100%' }}>
        HOW TO PLAY
      </button>

      <button className="btn btn-primary btn-two-line" onClick={onPlayClick} style={{ width: '100%' }}>
        <span className="btn-main-text">PLAY PREMIER LEAGUE</span>
        <span className="btn-sub-text">1992-2026</span>
      </button>

      <p className="label-mono" style={{ color: 'var(--grey-text)', opacity: 0.5, marginTop: '24px' }}>
        MORE COMPETITIONS COMING SOON...
      </p>

      <Footer />
    </div>
  );
}

export default Homepage;