// standings.js
// Job: fetch the current driver standings and show them in the table in index.html.

// "current" in the URL means the ongoing season, so we never hardcode a year.
const DRIVER_STANDINGS_URL =
  "https://api.jolpi.ca/ergast/f1/current/driverstandings.json";

// async/await lets us write "wait for the network" code in a readable top-to-bottom order.
async function loadDriverStandings() {
  // Grab the three page elements we need to change.
  const status = document.getElementById("standings-status");
  const table = document.getElementById("driver-table");
  const rows = document.getElementById("driver-rows");

  // try/catch: if anything inside fails (no internet, API down, unexpected
  // data shape), jump to the catch block instead of crashing silently.
  try {
    // 1. Ask the API for data. This returns a Response object, not the data yet.
    const response = await fetch(DRIVER_STANDINGS_URL);

    // fetch() only throws on network failure; a 404 or 500 still "succeeds",
    // so we check response.ok ourselves.
    if (!response.ok) {
      throw new Error("Server replied " + response.status);
    }

    // 2. Turn the response body (JSON text) into a JavaScript object.
    const data = await response.json();

    // 3. Dig down to the list we want. The API nests it several levels deep.
    //    Shape: MRData -> StandingsTable -> StandingsLists[0] -> DriverStandings
    const list = data.MRData.StandingsTable.StandingsLists[0];

    // Early in a season there may be no standings yet.
    if (!list) {
      status.textContent = "No standings published yet for this season.";
      return;
    }

    // 4. Convert each driver entry into a row of HTML, join them, and insert.
    //    .map() = "do this to every item and give me the results as a new array".
    rows.innerHTML = list.DriverStandings.map(renderDriverRow).join("");

    // 5. Hide the "Loading..." text and reveal the table.
    status.hidden = true;
    table.hidden = false;
  } catch (error) {
    status.textContent =
      "Couldn't load standings. Check your connection and refresh. (" +
      error.message +
      ")";
  }
}

// Takes ONE entry from the API's DriverStandings array and returns its <tr> HTML.
function renderDriverRow(entry) {
  const driver = entry.Driver;

  // A driver who switched teams mid-season has several constructors; show them all.
  const team = entry.Constructors.map((c) => c.name).join(" / ");

  // Template literal (backticks): ${...} drops a value into the string.
  return `
    <tr>
      <td>${entry.position}</td>
      <td>${driver.givenName} <strong>${driver.familyName}</strong></td>
      <td>${team}</td>
      <td class="num">${entry.points}</td>
    </tr>`;
}

// Kick everything off when the script loads.
loadDriverStandings();