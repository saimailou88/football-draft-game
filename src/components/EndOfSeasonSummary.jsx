// Shows final position, record, squad rating comparison (pre/post transfer window),
// and the transfer window recap -- rendered above the league table once gamePhase is 'finished'.
export default function EndOfSeasonSummary({
  leagueTable,
  yourRecord,
  originalAverages,
  currentAverages,
  transferHistory,
}) {
  // "Your Team" is one row inside the already-sorted leagueTable; its index+1 is the final position.
  const finalPosition = leagueTable.findIndex((row) => row.name === 'Your Team') + 1;

  return (
    <div className="end-of-season-summary">
      <h3>Season Complete</h3>

      <div className="final-position">
        <span className="final-position-number">#{finalPosition}</span>
        <span className="final-position-label">Final Position</span>
      </div>

      <div className="final-record">
        <span>P {yourRecord.played}</span>
        <span>W {yourRecord.won}</span>
        <span>D {yourRecord.drawn}</span>
        <span>L {yourRecord.lost}</span>
        <span>GF {yourRecord.goalsFor}</span>
        <span>GA {yourRecord.goalsAgainst}</span>
        <span>GD {yourRecord.goalsFor - yourRecord.goalsAgainst}</span>
        <span>Pts {yourRecord.points}</span>
      </div>

      <h4>Squad Rating: Draft Day vs Final</h4>
      <div className="rating-comparison">
        <RatingRow label="GK" before={originalAverages.gk} after={currentAverages.gk} />
        <RatingRow label="DEF" before={originalAverages.def} after={currentAverages.def} />
        <RatingRow label="MID" before={originalAverages.mid} after={currentAverages.mid} />
        <RatingRow label="FWD" before={originalAverages.fwd} after={currentAverages.fwd} />
        <RatingRow
          label="OVERALL"
          before={originalAverages.overall}
          after={currentAverages.overall}
          highlight
        />
      </div>

      <h4>Transfer Window Recap</h4>
      {transferHistory.length === 0 ? (
        <p className="no-transfers-made">No transfers made.</p>
      ) : (
        <div className="transfer-recap-list">
          {transferHistory.map((offer, index) => (
            <p key={index} className="transfer-recap-row">
              {offer.slotLabel}: {offer.outgoingPlayer.player_name} (
              {offer.outgoingPlayer.rating_overall}) → {offer.replacement.player_name} (
              {offer.replacement.rating_overall})
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Small helper for one GK/DEF/MID/FWD/Overall comparison row -- same before/delta/after
// pattern used in the transfer window popup, kept visually consistent with it.
function RatingRow({ label, before, after, highlight }) {
  if (before === null || after === null) return null;
  const delta = round1(after - before);
  const deltaDisplay = delta === 0 ? '' : ` (${delta > 0 ? '+' : ''}${delta})`;
  const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : '';

  return (
    <div className={`average-stat-row ${highlight ? 'highlight' : ''}`}>
      <span className="average-stat-label">{label}</span>
      <span className="average-stat-value">
        {round1(before)}
        <span className={`average-stat-delta ${deltaClass}`}>{deltaDisplay}</span>
        {delta !== 0 && <span className="average-stat-current"> → {round1(after)}</span>}
      </span>
    </div>
  );
}

function round1(value) {
  return Math.round(value);
}