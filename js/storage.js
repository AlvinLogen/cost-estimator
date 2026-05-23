// STORAGE.JS — localStorage interactions
// ============================================

const STORAGE_KEY = "cost-estimator-history";

// SAVE — Prepend a new estimate record to history
// ============================================

function saveEstimateToStorage(estimateResult, projectName) {
  const history = loadHistoryFromStorage();

  const record = {
    id: Date.now().toString(),
    savedAt: new Date().toISOString(),
    projectName: projectName,
    data: estimateResult,
  };

  history.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  return record;
}

// LOAD — Return the full history array (or empty array)
// ============================================

function loadHistoryFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(
      "cost-estimator: localStorage data was corrupt, resetting.",
      err,
    );
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

// DELETE — Remove a single record by ID
// ============================================

function deleteEstimatorFromStorage(id) {
  const history = loadHistoryFromStorage();
  const updated = history.filter(function (record) {
    return record.id !== id;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// FORMAT DATE — Turn ISO string into readable label
// ============================================
function formatSavedDate(isoString) {
  try {
    return new Date(isoString).toLocaleString();
  } catch (err) {
    return isoString;
  }
}
