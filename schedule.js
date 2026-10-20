// schedule.js
// Job: fetch the full season schedule, find the next 3 races that haven't
// started yet, and show them (a big card for the next one, a short list for the rest).

// One request gives us every round of the season. We filter it ourselves.
const SCHEDULE_URL = "https://api.jolpi.ca/ergast/f1/current.json";

// Every time on this page is shown in IST, whatever timezone the device is set to.
const DISPLAY_TIME_ZONE = "Asia/Kolkata";

// The sessions we look for on each race in the API data (key = field name in the JSON).
// A normal weekend has Practice 1-3 and Qualifying. A sprint weekend has Practice 1,
// Sprint Qualifying, Sprint and Qualifying instead. We don't need to know which kind
// of weekend it is: we just keep whichever of these fields the race actually has.
const SESSION_FIELDS = [
  { key: "FirstPractice", label: "Practice 1" },
  { key: "SecondPractice", label: "Practice 2" },
  { key: "ThirdPractice", label: "Practice 3" },
  { key: "SprintQualifying", label: "Sprint Qualifying" },
  { key: "Sprint", label: "Sprint" },
  { key: "Qualifying", label: "Qualifying" },
];

async function loadSchedule() {
  const status = document.getElementById("schedule-status");
  const card = document.getElementById("next-race");
  const list = document.getElementById("upcoming-races");

  try {
    const response = await fetch(SCHEDULE_URL);
    if (!response.ok) {
      throw new Error("Server replied " + response.status);
    }

    const data = await response.json();

    // Shape: MRData -> RaceTable -> Races (an array, one item per round)
    const races = data.MRData.RaceTable.Races;

    const now = new Date();

    // Pipeline: pair each race with its start time -> keep only future ones -> take 3.
    // The API already returns races in calendar order, so we don't need to sort.
    // A race that has already started counts as "not upcoming", which also means
    // the page never shows an in-progress race as "next".
    const upcoming = races
      .map((race) => ({ race: race, start: getRaceStart(race) }))
      .filter((item) => item.start > now)
      .slice(0, 3);

    if (upcoming.length === 0) {
      status.textContent = "No more races this season.";
      return;
    }

    // First upcoming race gets the big card.
    const next = upcoming[0];

    // Only the next race gets the full weekend schedule (the list below it doesn't).
    // Sessions that have already happened this week get a "past" class so the CSS can fade them.
    const sessionRows = getWeekendSessions(next.race)
      .map(
        (session) => `
        <li class="${session.start < now ? "past" : ""}">
          <span>${session.label}</span>
          <span class="race-time">${formatSessionTime(session.start)}</span>
        </li>`
      )
      .join("");

    card.innerHTML = `
      <h3>${next.race.raceName}</h3>
      <p class="race-where">${next.race.Circuit.circuitName}</p>
      <p class="race-where">${next.race.Circuit.Location.locality}, ${next.race.Circuit.Location.country}</p>
      <p class="race-when">${formatRaceTime(next.start)}</p>
      <h4>Weekend schedule (IST)</h4>
      <ul class="sessions">${sessionRows}</ul>`;

    // The remaining ones (index 1 onward) become simple list rows.
    list.innerHTML = upcoming
      .slice(1)
      .map(
        (item) => `
      <li>
        <span>${item.race.raceName}</span>
        <span class="race-time">${formatRaceTime(item.start)}</span>
      </li>`
      )
      .join("");

    status.hidden = true;
    card.hidden = false;
    list.hidden = false;

    // Hand the next race to weather.js (loaded before this file). We don't wait for it:
    // the weather fills in on its own, and a weather problem can't break the schedule.
    loadWeather(next.race, next.start);

    // Same idea for the circuit stats and track drawing (circuit.js).
    loadCircuit(next.race);
  } catch (error) {
    status.textContent =
      "Couldn't load the schedule. Check your connection and refresh. (" +
      error.message +
      ")";
  }
}

// Combines the API's separate date and time fields into one JavaScript Date.
// The API gives UTC like date "2026-11-08" and time "15:00:00Z".
// The trailing Z tells JavaScript "this is UTC", so the Date is exact.
function getRaceStart(race) {
  const time = race.time || "00:00:00Z"; // a few races may be missing a time
  return new Date(`${race.date}T${time}`);
}

// Turns a Date into readable text in IST. Passing undefined as the first argument
// means "use this device's language and date style"; the timeZone option is what
// forces IST regardless of the device's timezone.
function formatRaceTime(date) {
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

// Same as above without the timezone name, because the session list already says
// "(IST)" once in its heading and repeating it on every row would be clutter.
function formatSessionTime(date) {
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

// Collects every session of a race weekend into one list, earliest first.
// In the API each session is a small object with its own date and time,
// e.g. race.FirstPractice = { date: "2026-10-23", time: "17:30:00Z" }.
// That's the same shape as the race's own date/time, so getRaceStart() works on them too.
function getWeekendSessions(race) {
  const sessions = SESSION_FIELDS
    .filter((field) => race[field.key]) // keep only the sessions this race has
    .map((field) => ({
      label: field.label,
      start: getRaceStart(race[field.key]),
    }));

  // The race itself isn't in a separate field, so add it by hand.
  sessions.push({ label: "Race", start: getRaceStart(race) });

  // Subtracting two Dates gives milliseconds, so this sorts earliest to latest.
  return sessions.sort((a, b) => a.start - b.start);
}

loadSchedule();

// NOTE for later: each race also has race.Circuit.Location.lat and .long.
// The weather feature will use those, so we're not throwing that data away.