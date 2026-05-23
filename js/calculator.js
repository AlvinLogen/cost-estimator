function validateConfig(config) {
  const errors = [];

  if (!config.projectName || config.projectName.trim() === "") {
    errors.push("Project name is required.");
  }

  const duration = config.durationWeeks;
  if (!Number.isInteger(duration) || duration < 1) {
    errors.push("Duration weeks must be greater than or equal to 1.");
  }

  if (!Array.isArray(config.roles) || config.roles.length === 0) {
    errors.push("At least one role is required");
  } else {
    config.roles.forEach(function (role, index) {
      if (typeof role.name !== "string" || role.name.trim() === "") {
        errors.push("Role " + (index + 1) + ": name is required.");
      }

      if (!isFinite(role.hourlyRate) || role.hourlyRate <= 0) {
        errors.push(
          "Role " + (index + 1) + ": hourly rate must be a positive number.",
        );
      }

      if (!Number.isInteger(role.hoursPerWeek) || role.hoursPerWeek < 1) {
        errors.push(
          "Role " + (index + 1) + ": hours per week must be a whole number.",
        );
      }
    });
  }

  return errors;
}

function calculateEstimate(config) {
  const errors = validateConfig(config);

  if (errors.length > 0) {
    throw new Error("Invalid estimate config:\n" + errors.join("\n"));
  }

  let subTotal = 0;
  let totalHours = 0;

  const rolesBreakdown = config.roles.map(function (role) {
    const roleTotalHours = role.hoursPerWeek * config.durationWeeks;
    const roleTotalCost = roleTotalHours * role.hourlyRate;

    subTotal += roleTotalCost;
    totalHours += roleTotalHours;

    return {
      name: role.name,
      hourlyRate: role.hourlyRate,
      hoursPerWeek: role.hoursPerWeek,
      roleTotalHours: roleTotalHours,
      roleTotalCost: roleTotalCost,
    };
  });

  const contingencyAmount = config.addContingency ? subTotal * 0.15 : 0;
  const finalTotal = subTotal + contingencyAmount;

  return {
    projectName: config.projectName,
    durationWeeks: config.durationWeeks,
    rolesBreakdown: rolesBreakdown,
    subTotal: subTotal,
    totalHours: totalHours,
    contingencyAmount: contingencyAmount,
    finalTotal: finalTotal,
    hasContingency: config.addContingency,
  };
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(amount) {
  if (!isFinite(amount)) return "$0.00";
  return currencyFormatter.format(amount);
}
