// EXPORT.JS - CSV generation and file download
// ============================================

function sanitizeCsvField(value) {
  // Convert to string - handles numbers, booleans, null and undefined and escape double quotes
  var str = String(value == null ? "" : value);
  str = str.replace(/"/g, '""');

  // Neutralise formula injection: prefix with apostrophe if the value starts with = + - @ or a tab character
  if (/^[=+\-@\t]/.test(str)) {
    str = "'" + str;
  }

  return '"' + str + '"';
}

// BUILD CSV — Generate the full CSV string
// ============================================

function buildCsvContent(estimateResult) {
  var lines = [];

  lines.push(["Project Cost Estimate"].join(","));
  lines.push(
    [
      sanitizeCsvField("Project"),
      sanitizeCsvField(estimateResult.projectName),
    ].join(","),
  );
  lines.push(
    [
      sanitizeCsvField("Duration (weeks)"),
      sanitizeCsvField(estimateResult.durationWeeks),
    ].join(","),
  );
  lines.push(
    [
      sanitizeCsvField("Contingency included"),
      sanitizeCsvField(estimateResult.hasContingency ? "Yes" : "No"),
    ].join(","),
  );
  lines.push(
    [
      sanitizeCsvField("Subtotal"),
      sanitizeCsvField(estimateResult.subTotal.toFixed(2)),
    ].join(","),
  );

  if (estimateResult.hasContingency) {
    lines.push(
      [
        sanitizeCsvField("Contingency (15%)"),
        sanitizeCsvField(estimateResult.contingencyAmount.toFixed(2)),
      ].join(","),
    );
  }
  lines.push(
    [
      sanitizeCsvField("Final Total"),
      sanitizeCsvField(estimateResult.finalTotal.toFixed(2)),
    ].join(","),
  );

  // Blank seperator row
  lines.push("");

  lines.push(
    [
      sanitizeCsvField("Role"),
      sanitizeCsvField("Rate ($/hr)"),
      sanitizeCsvField("Hours / Week"),
      sanitizeCsvField("Total Hours"),
      sanitizeCsvField("Total Cost ($)"),
    ].join(","),
  );

  estimateResult.rolesBreakdown.forEach(function (role) {
    lines.push(
      [
        sanitizeCsvField(role.name),
        sanitizeCsvField(role.hourlyRate.toFixed(2)),
        sanitizeCsvField(role.hoursPerWeek),
        sanitizeCsvField(role.roleTotalHours),
        sanitizeCsvField(role.roleTotalCost.toFixed(2)),
      ].join(","),
    );
  });

  return lines.join("\r\n");
}

// DOWNLOAD — Create a Blob and trigger download
// ============================================

function downloadCsv(csvContent, filename) {
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);

  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// EXPORT — Public function called by ui.js
// ============================================

function exportEstimateToCsv(estimateResult) {
  var csvContent = buildCsvContent(estimateResult);

  // Build a filename from the project name: spaces → underscores
  var safeName = estimateResult.projectName
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);

  var dateStr = new Date().toISOString().slice(0, 10);
  var filename = (safeName || "estimate") + "_" + dateStr + ".csv";

  downloadCsv(csvContent, filename);
}
