const STORAGE_KEY = 'dugoutHistory';

// Reads all saved season history entries from localStorage. Returns an
// empty array if nothing has been saved yet, or if the stored data is
// missing/corrupted for any reason -- so a bad read never crashes the
// History screen, it just shows an empty list.
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read history from localStorage:', err);
    return [];
  }
}

// Saves a completed season's result. If an entry already exists for this
// exact season_year, it's only overwritten when the new result is a
// better (lower) final position -- so replaying a season keeps your best
// run rather than your most recent one.
export function saveSeasonResult(entry) {
  try {
    const history = getHistory();
    const existingIndex = history.findIndex((e) => e.season_year === entry.season_year);

    if (existingIndex === -1) {
      history.push(entry);
    } else if (entry.final_position < history[existingIndex].final_position) {
      history[existingIndex] = entry;
    } else {
      return; // existing best run for this season stays as-is
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save history to localStorage:', err);
  }
}

// Triggers a browser download of the full history as a .json file, so the
// player has a backup that survives clearing their browser data.
export function exportHistory() {
  const history = getHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'the-dugout-history.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Reads a previously exported .json file and merges it back into
// localStorage -- takes a File object (e.g. from an <input type="file">)
// and an onComplete(success, history) callback, since file reading is
// asynchronous. Merging (rather than overwriting) means importing an old
// backup never accidentally erases better runs played since that backup.
export function importHistory(file, onComplete) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid history file');

      imported.forEach((entry) => saveSeasonResult(entry));
      onComplete(true, getHistory());
    } catch (err) {
      console.error('Failed to import history file:', err);
      onComplete(false, null);
    }
  };

  reader.onerror = () => onComplete(false, null);
  reader.readAsText(file);
}