import { TransferRow } from './TransferWindow';

function round1(value) {
  return Math.round(value);
}

// Shows final position, record, squad rating comparison (pre/post transfer
// window), and the transfer window recap -- rendered above the league table
// once gamePhase is 'finished'. Everything lives inside one bordered card.
export default function EndOfSeasonSummary({
  leagueTable,
  yourRecord,
  originalAverages,
  currentAverages,
  transferHistory,
}) {
  const finalPosition = leagueTable.findIndex((row) => row.name === 'Your Team') + 1;
  const goalDiff = yourRecord.goalsFor - yourRecord.goalsAgainst;

  return (
    <div className="eos-box">
      <p className="field-label">Season Complete</p>

      <div className="eos-headline">
        <div className="eos-position">
          <span className="eos-position-number">#{finalPosition}</span>
          <span className="field-subtext" style={{ marginTop: '2px' }}>FINAL POSITION</span>
        </div>
        <div className="eos-record-grid">
          <div className="eos-record-cell"><span className="eos-record-value">{yourRecord.played}</span><span className="eos-record-label">P</span></div>
          <div className="eos-record-cell"><span className="eos-record-value">{yourRecord.won}</span><span className="eos-record-label">W</span></div>
          <div className="eos-record-cell"><span className="eos-record-value">{yourRecord.drawn}</span><span className="eos-record-label">D</span></div>
          <div className="eos-record-cell"><span className="eos-record-value">{yourRecord.lost}</span><span className="eos-record-label">L</span></div>
          <div className="eos-record-cell"><span className="eos-record-value">{goalDiff > 0 ? `+${goalDiff}` : goalDiff}</span><span className="eos-record-label">GD</span></div>
          <div className="eos-record-cell"><span className="eos-record-value eos-pts">{yourRecord.points}</span><span className="eos-record-label">PTS</span></div>
        </div>
      </div>

      <p className="field-label" style={{ marginTop: '20px' }}>Squad Rating: Draft Day → Final</p>
      <div className="eos-rating-list">
        <RatingCompareRow label="GK" before={originalAverages.gk} after={currentAverages.gk} />
        <RatingCompareRow label="DEF" before={originalAverages.def} after={currentAverages.def} />
        <RatingCompareRow label="MID" before={originalAverages.mid} after={currentAverages.mid} />
        <RatingCompareRow label="FWD" before={originalAverages.fwd} after={currentAverages.fwd} />
        <RatingCompareRow label="OVR" before={originalAverages.overall} after={currentAverages.overall} highlight />
      </div>

      <p className="field-label" style={{ marginTop: '20px' }}>Transfer Window Recap</p>
      {transferHistory.length === 0 ? (
        <p className="no-slot-text">No transfers made.</p>
      ) : (
        <div className="tw-row-list">
          {transferHistory.map((offer, index) => {
            const isUpgrade = offer.replacement.rating_overall > offer.outgoingPlayer.rating_overall;
            const isDowngrade = offer.replacement.rating_overall < offer.outgoingPlayer.rating_overall;
            const resultClass = isUpgrade ? 'transfer-row-upgrade' : isDowngrade ? 'transfer-row-downgrade' : '';
            return (
              <TransferRow key={index} offer={offer} hideRating={false} resultClass={resultClass} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RatingCompareRow({ label, before, after, highlight }) {
  if (before === null || after === null) return null;
  const delta = round1(after - before);
  const directionClass = delta > 0 ? 'eos-rating-up' : delta < 0 ? 'eos-rating-down' : '';

  return (
    <div className={`eos-rating-row ${highlight ? 'eos-rating-highlight' : ''} ${directionClass}`}>
      <span className="eos-rating-label">{label}</span>
      <span className="eos-rating-values">
        {round1(before)} <span className="eos-rating-arrow">→</span> {round1(after)}
      </span>
    </div>
  );
}