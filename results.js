// results.js
// Job: fetch the results of the most recently finished race and show them in a table.
// If that race weekend also had a sprint, add a "Sprint pts" column next to the race points.
// No polling: "last" only ever points at a race that has already finished, so this
// page picks up new results simply by being refreshed after a race.

const RESULTS_URL = "https://api.jolpi.ca/ergast/f1/current/last/results.json";
const SPRINT_URL = "https://api.jolpi.ca/ergast/f1/current/last/sprint.json";

async function loadLastResults() {
  const title = document.getElementById("results-title");
  const status = document.getElementById("results-status");
  const table = document.getElementById("results-table");
  const rows = document.getElementById("results-rows");

  try {
    // Promise.all starts BOTH requests at the same time and waits until both finish,
    // which is faster than fetching one after the other.
    // loadSprintPoints() never throws (see below), so a sprint problem can't break the race table.
    const [response, sprint] = await Promise.all([
      fetch(RESULTS_URL),
      loadSprintPoints(),
    ]);

    if (!response.ok) {
      throw new Error("Server replied " + response.status);
    }

    const data = await response.json();

    // Shape: MRData -> RaceTable -> Races[0] -> Results (one item per driver)
    // "last" returns exactly one race, so we take index 0.
    const race = data.MRData.RaceTable.Races[0];

    // Before the first race of a season there is nothing to show.
    if (!race) {
      status.textContent = "No race results yet this season.";
      return;
    }

    // Only use the sprint data if it belongs to the SAME round as this race.
    // (On a sprint weekend, between Saturday's sprint and Sunday's race, "last sprint"
    // would be newer than "last race", and we don't want to mix the two up.)
    const sprintPoints = sprint && sprint.round === race.round ? sprint.points : null;

    // Add a class to the table when there's a sprint; the CSS shows the extra column.
    table.classList.toggle("has-sprint", sprintPoints !== null);

    title.textContent = `Last race: ${race.raceName} (${formatRaceDate(race.date)})`;

    // The arrow function wraps renderResultRow so each row also gets the sprint lookup.
    rows.innerHTML = race.Results
      .map((result) => renderResultRow(result, sprintPoints))
      .join("");

    status.hidden = true;
    table.hidden = false;
  } catch (error) {
    status.textContent =
      "Couldn't load the results. Check your connection and refresh. (" +
      error.message +
      ")";
  }
}

// Fetches the last sprint and returns { round, points } where points looks like
// { "max_verstappen": "8", "norris": "7", ... } (driver id -> sprint points).
// Returns null if there was no sprint or anything went wrong. A missing sprint is
// normal (most weekends don't have one), so this deliberately swallows errors.
async function loadSprintPoints() {
  try {
    const response = await fetch(SPRINT_URL);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Not a sprint weekend: the API returns an empty Races array.
    const race = data.MRData.RaceTable.Races[0];
    if (!race) {
      return null;
    }

    // Build a lookup object so we can find any driver's sprint points instantly
    // by their id, instead of searching through the list for every row.
    const points = {};
    race.SprintResults.forEach((result) => {
      points[result.Driver.driverId] = result.points;
    });

    return { round: race.round, points: points };
  } catch (error) {
    return null;
  }
}

// One <tr> per driver.
function renderResultRow(result, sprintPoints) {
  const driver = result.Driver;

  // The Time field only exists for drivers who finished on the lead lap:
  // the winner gets the total race time, the rest get the gap to the winner.
  // Everyone else (lapped, retired, disqualified) has no Time, so we show their
  // status text instead, e.g. "+1 Lap" or "Collision".
  const finish = result.Time ? result.Time.time : result.status;

  // Sprint points for this driver. ?? means "use the value on the right if the
  // left side is missing", so a driver who didn't take part in the sprint shows 0.
  // With no sprint at all we leave the cell empty (and the CSS hides the column anyway).
  const sprint = sprintPoints ? (sprintPoints[driver.driverId] ?? "0") : "";

  // positionText is the finishing position as shown, or a letter code for
  // drivers without a classified position (R = retired, D = disqualified, ...).
  return `
    <tr>
      <td>${result.positionText}</td>
      <td>${driver.givenName} <strong>${driver.familyName}</strong></td>
      <td>${result.Constructor.name}</td>
      <td>${finish}</td>
      <td class="num">${result.points}</td>
      <td class="num sprint-col">${sprint}</td>
    </tr>`;
}

// The API gives a plain date like "2026-10-25" with no time.
// Adding T00:00:00 makes JavaScript read it as local midnight, which stops the
// date shifting by a day in some timezones.
function formatRaceDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

loadLastResults();