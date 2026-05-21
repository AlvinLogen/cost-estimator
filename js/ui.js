// UI.JS - DOM wiring, events and rendering. Calls functions from calculator.js, storage.js and export.js
// ============================

let currentRoles = [];

const projectNameInput = document.getElementById("projectName");
const durationWeeksInput = document.getElementById("durationWeeks");
const roleNameInput = document.getElementById("roleName");
const hourlyRateInput = document.getElementById("hourlyRate");
const hoursPerWeekInput = document.getElementById("hoursPerWeek");
const addContingencyInput = document.getElementById("addContingency");

const addRoleBtn = document.getElementById("addRoleBtn");
const estimatorForm = document.getElementById("estimator-form");
const saveBtn = document.getElementById("saveBtn");
const exportBtn = document.getElementById("exportBtn");

const rolesListEl = document.getElementById("rolesList");
const emptyStateEl = document.getElementById("emptyState");
const resultsAreaEl = document.getElementById("resultsArea");
const resTotal = document.getElementById("resTotal");
const resWeeks = document.getElementById("resWeeks");
const resHours = document.getElementById("resHours");
const resContingency = document.getElementById("resContingency");
const resTableBody = document.getElementById("resTableBody");
const contingencyNoteEl = document.getElementById("contingencyNote");
const contingencyAmountEl = document.getElementById("contingencyAmount");

// ADD ROLE - Validate and push to State
// =====================================

addRoleBtn.addEventListener("click", function () {
  const name = roleNameInput.value.trim();
  const rate = parseFloat(hourlyRateInput.value);
  const hours = parseInt(hoursPerWeekInput.value, 10);

  if (name === "") {
    alert("Please enter a role title");
    roleNameInput.focus();
    return;
  }

  if (isNaN(rate) || rate <= 0) {
    alert("Please enter a valid hourly rate (must be greater than 0).");
    hourlyRateInput.focus();
    return;
  }

  if (isNaN(hours) || hours < 1 || !Number.isInteger(hours)) {
    alert("Please enter valid hours per week (whole number, at least 1).");
    hoursPerWeekInput.focus();
    return;
  }

  currentRoles.push({ name: name, hourlyRate: rate, hoursPerWeek: hours });

  renderRolesList();

  // Clear inputs and return focus for fast entry of multiple roles
  roleNameInput.value = "";
  hourlyRateInput.value = "";
  hoursPerWeekInput.value = "";
  roleNameInput.focus();
});

// RENDER ROLES LIST - Build UI from State
// =======================================

function renderRolesList() {
  rolesListEl.innerHTML = "";

  if (currentRoles.length === 0) {
    const emptyMsg = document.createElement("li");
    emptyMsg.className = "text-slate=400 text-xs italic";
    emptyMsg.textContent = "No roles added yet.";
    rolesListEl.appendChild(emptyMsg);
    return;
  }

  currentRoles.forEach(function (role, index) {
    const li = document.createElement("li");
    li.className =
      "flex items-center justify-between bg-slate-50" +
      "rounded-lg px-3 py-2 border border-slate-200";

    const textSpan = document.createElement("span");
    textSpan.className = "text-sm text-slate-700";
    textSpan.textContent =
      role.name +
      " - $" +
      role.hourlyRate +
      "/hr, " +
      role.hoursPerWeek +
      " hrs/wk";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className =
      "text-red-400 hover:text-red-600 text-lg leading-none " +
      "focus:outline-none focus:ring-1 focus:ring-red-400 rounded";
    removeBtn.setAttribute("aria-label", "Remove " + role.name);
    removeBtn.textContent = "x";

    // Closure: each button captures its own index from the forEach loop
    removeBtn.addEventListener("click", function () {
      removeRole(index);
    });

    li.appendChild(textSpan);
    li.appendChild(removeBtn);
    rolesListEl.appendChild(li);
  });
}

function removeRole(index) {
  currentRoles.splice(index, 1);
  renderRolesList();
}

// FORM SUBMIT - Calculate and display results
// ===========================================

estimatorForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const projectName = projectNameInput.value.trim();
  const durationWeeks = parseInt(durationWeeksInput.value, 10);
  const addContingency = addContingencyInput.checked;

  if (projectName === "") {
    alert("Please enter a project name.");
    projectNameInput.focus();
    return;
  }

  if (isNaN(durationWeeks) || durationWeeks < 1) {
    alert("Please enter a valid duration (whole number of weeks, at least 1).");
    durationWeeksInput.focus();
    return;
  }

  if (currentRoles.length === 0) {
    alert("Please add at least one role before calculating.");
    roleNameInput.focus();
    return;
  }

  const config = {
    projectName: projectName,
    durationWeeks: durationWeeks,
    roles: currentRoles,
    addContingency: addContingency,
  };

  let result;

  try {
    result = calculateEstimate(config);
  } catch (err) {
    alert("Calculation error: " + err.message);
    return;
  }

  // Update summary stat cards
  resTotal.textContent = formatCurrency(result.finalTotal);
  resWeeks.textContent = result.durationWeeks + " wks";
  resHours.textContent = result.totalHours + " hrs";
  resContingency.textContent = formatCurrency(result.contingencyAmount);

  // Build the role breakdown table rows
  resTableBody.innerHTML = "";
  result.rolesBreakdown.forEach(function (role) {
    var tr = document.createElement("tr");
    tr.className = "border-b border-slate-100 last:border-0";

    var cellValues = [
      role.name,
      formatCurrency(role.hourlyRate) + "/hr",
      role.hoursPerWeek + " hrs",
      role.roleTotalHours + " hrs",
      formatCurrency(role.roleTotalCost),
    ];

    cellValues.forEach(function (value, i) {
      var td = document.createElement("td");
      td.className =
        "px-4 py3" + (i === cellValues.length - 1 ? " font-semibold" : "");
      td.textContent = value;
      tr.appendChild(td);
    });

    resTableBody.appendChild(tr);
  });

  // Contingency Note
  if (result.hasContingency) {
    contingencyAmountEl.textContent = formatCurrency(result.contingencyAmount);
    contingencyNoteEl.classList.remove("hidden");
  } else {
    contingencyNoteEl.classList.add("hidden");
  }

  // Show results, hide empty state
  emptyStateEl.classList.add("hidden");
  resultsAreaEl.classList.remove("hidden");

  saveBtn.classList.remove("hidden");
  exportBtn.classList.remove("hidden");

  // Store the results on the forms dataset
  estimatorForm.dataset.lastResult = JSON.stringify(result);
});

// SAVE BUTTON — Persist the current estimate
// ============================================
const historyPanelEl = document.getElementById("historyPanel");
const historyListEl = document.getElementById("historyList");

saveBtn.addEventListener("click", function () {
  const raw = estimatorForm.dataset.lastResult;

  if (!raw) return;

  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    alert("Could not save estimate - data was unreadable.");
    return;
  }

  const projectName = projectNameInput.value.trim() || "Unnamed Project";
  saveEstimateToStorage(result, projectName);

  renderHistoryPanel();

  const originalText = saveBtn.textContent;
  saveBtn.textContent = "Saved ✓";
  saveBtn.disabled = true;

  setTimeout(function () {
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }, 2000);
});

// HISTORY PANEL — Render all saved estimates
// ============================================

function renderHistoryPanel() {
  const history = loadHistoryFromStorage();

  if (history.length === 0) {
    historyPanelEl.classList.add("hidden");
    return;
  }

  historyPanelEl.classList.remove("hidden");
  historyListEl.innerHTML = "";

  history.forEach(function (record) {
    const li = document.createElement("li");
    li.className =
      "flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3";

    const infoDiv = document.createElement("div");
    infoDiv.className = "flex-1 min-w-0";

    const nameEl = document.createElement("p");
    nameEl.className = "text-sm font-semibold text-slate-800 truncate";
    nameEl.textContent = record.projectName;

    const metaEl = document.createElement("p");
    metaEl.className = "text-xs text-slate-400 mt-0.5";
    metaEl.textContent =
      formatSavedDate(record.savedAt) +
      " . " +
      formatCurrency(record.data.finalTotal);

    infoDiv.appendChild(nameEl);
    infoDiv.appendChild(metaEl);

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className =
      "text-slate-300 hoever:text-red-400 text-xl leading-none focus:outline-none focus:ring-1 focus:ring-red-300 rounded shrink-0";
    delBtn.setAttribute("aria-label", "Delete estimate: " + record.projectName);
    delBtn.textContent = "x";

    delBtn.addEventListener("click", function () {
      deleteEstimatorFromStorage(record.id);
      renderHistoryPanel();
    });

    li.appendChild(infoDiv);
    li.appendChild(delBtn);
    historyListEl.appendChild(li);
  });
}

// INIT — Load history on page start
// ============================================

renderHistoryPanel();
