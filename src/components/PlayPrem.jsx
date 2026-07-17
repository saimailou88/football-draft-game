import { useState, useRef, useEffect } from 'react';
import PitchPreview from './PitchPreview';

function formatSeasonLabel(season) {
  const nextYearShort = (season + 1).toString().slice(-2);
  return `${season}-${nextYearShort}`;
}

function PlayPrem({
  difficulty,
  onSelectDifficulty,
  availableSeasons,
  selectedSeason,
  onSelectSeason,
  formations,
  selectedFormation,
  onSelectFormation,
  totalBudget,
  minBudget,
  maxBudget,
  onGenerateBudget,
  onBudgetRolled,
  onConfirmPlay,
  onBack,
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayBudget, setDisplayBudget] = useState(null);
  const spinIntervalRef = useRef(null);

  // Cleans up the interval if the component unmounts mid-spin (e.g. player
  // navigates away), so it doesn't keep firing on a screen that's gone.
  useEffect(() => {
    return () => clearInterval(spinIntervalRef.current);
  }, []);

  const canRollBudget = difficulty && selectedSeason && selectedFormation;
  const canPlay = totalBudget !== null;

  function randomDisplayValue() {
    return Math.floor(Math.random() * (maxBudget - minBudget + 1)) + minBudget;
  }

  function handleRollBudgetClick() {
    if (!canRollBudget || isRolling || totalBudget !== null) return;

    // Decide the real value right away -- the spin is purely visual from
    // here, cycling toward a number that's already locked in behind the scenes.
    const finalValue = onGenerateBudget();

    setIsRolling(true);
    setDisplayBudget(randomDisplayValue());

    spinIntervalRef.current = setInterval(() => {
      setDisplayBudget(randomDisplayValue());
    }, 45);

    setTimeout(() => {
      clearInterval(spinIntervalRef.current);
      setDisplayBudget(finalValue);
      setIsRolling(false);
      onBudgetRolled(finalValue);
    }, 1000);
  }

  return (
    <div style={{ padding: '20px 24px 60px' }}>
      <button
        className="btn btn-dark"
        onClick={onBack}
        style={{ padding: '10px 16px', fontSize: '13px', marginBottom: '20px' }}
      >
        ← BACK
      </button>

      <h1 className="section-title" style={{ fontSize: '24px', marginBottom: '24px' }}>
        PLAY PREM
      </h1>

      <p className="field-label">Difficulty</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        <div className="difficulty-option">
          <button
            className={`btn ${difficulty === 'easy' ? 'btn-primary' : 'btn-dark'}`}
            style={{ width: '100%' }}
            onClick={() => onSelectDifficulty('easy')}
          >
            EASY
          </button>
          <p className="field-subtext">SEE RATINGS</p>
        </div>
        <div className="difficulty-option">
          <button
            className={`btn ${difficulty === 'hard' ? 'btn-primary' : 'btn-dark'}`}
            style={{ width: '100%' }}
            onClick={() => onSelectDifficulty('hard')}
          >
            HARD
          </button>
          <p className="field-subtext">HIDDEN RATINGS</p>
        </div>
      </div>

      <p className="field-label">Season</p>
      <select
        className="season-select"
        style={{ marginBottom: '28px' }}
        value={selectedSeason ?? ''}
        onChange={(e) => onSelectSeason(Number(e.target.value))}
      >
        <option value="" disabled>Select a season</option>
        {availableSeasons.map((season) => (
          <option key={season} value={season}>{formatSeasonLabel(season)}</option>
        ))}
      </select>

      <p className="field-label">Formation</p>
      <div className="formation-chip-row" style={{ marginBottom: '20px' }}>
        {Object.keys(formations).map((formationName) => (
          <div
            key={formationName}
            className={`formation-chip ${selectedFormation === formationName ? 'selected' : ''}`}
            onClick={() => onSelectFormation(formationName)}
          >
            {formationName}
          </div>
        ))}
      </div>

      {selectedFormation && (
        <div style={{ marginBottom: '28px' }}>
          <PitchPreview
            formationName={selectedFormation}
            formationSlots={formations[selectedFormation]}
          />
        </div>
      )}

      <p className="field-label">Budget</p>
      {totalBudget === null ? (
        <button
          className={`btn btn-secondary ${isRolling ? 'budget-spinning' : ''}`}
          style={{ width: '100%', marginBottom: '16px' }}
          onClick={handleRollBudgetClick}
          disabled={!canRollBudget || isRolling}
        >
          {isRolling ? `£${displayBudget}M` : 'RANDOMISE BUDGET'}
        </button>
      ) : (
        <div className="budget-display" style={{ marginBottom: '16px' }}>
          £{totalBudget}M
        </div>
      )}

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={onConfirmPlay}
        disabled={!canPlay}
      >
        PLAY SEASON
      </button>
    </div>
  );
}

export default PlayPrem;