// weather.js
// Job: show the forecast for the NEXT race, but only from the Monday of race week.
// This file doesn't run by itself. schedule.js already knows which race is next, so it
// calls loadWeather(race, raceStart) once the race card is on screen. That avoids
// downloading the schedule a second time.

// Open-Meteo: free, no API key. We give it a latitude/longitude and it gives back
// hour-by-hour forecast arrays.
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// How many hours after lights-out we check for rain. A race is about 2 hours long.
const RACE_WINDOW_HOURS = 2;

async function loadWeather(race, raceStart) {
  const box = document.getElementById("weather");

  // Rule: only show the forecast from the Monday of race week.
  const showFrom = getRaceWeekMonday(raceStart);
  if (new Date() < showFrom) {
    box.innerHTML = `<p class="weather-detail">Race weather appears on ${formatDay(showFrom)}.</p>`;
    box.hidden = false;
    return;
  }

  try {
    // The schedule data already carries the circuit's coordinates.
    const location = race.Circuit.Location;

    // URLSearchParams builds the "?a=1&b=2" part of a URL for us and handles encoding.
    const params = new URLSearchParams({
      latitude: location.lat,
      longitude: location.long,
      hourly: "precipitation_probability,temperature_2m",
      timezone: "UTC", // so the hourly times line up with the race's UTC start time
      forecast_days: 10,
    });

    const response = await fetch(`${WEATHER_URL}?${params}`);
    if (!response.ok) {
      throw new Error("Server replied " + response.status);
    }

    const data = await response.json();

    // The response holds parallel arrays: time[5] goes with temperature_2m[5], etc.
    // times look like "2026-11-08T17:00" (UTC, one entry per hour).
    const times = data.hourly.time;
    const chances = data.hourly.precipitation_probability;
    const temps = data.hourly.temperature_2m;

    // Find which array position matches the hour the race starts.
    // toISOString() gives "2026-11-08T17:30:00.000Z"; the first 13 characters are
    // "2026-11-08T17", so adding ":00" gives the format Open-Meteo uses.
    const startKey = raceStart.toISOString().slice(0, 13) + ":00";
    const start = times.indexOf(startKey);

    if (start === -1) {
      box.innerHTML = `<p class="weather-detail">Forecast for race time isn't available yet.</p>`;
      box.hidden = false;
      return;
    }

    // Highest rain chance across the race window (the start hour and the next ones).
    // Some hours can be null (no data), so we drop those first.
    const windowChances = chances
      .slice(start, start + RACE_WINDOW_HOURS + 1)
      .filter((value) => value !== null);

    if (windowChances.length === 0) {
      box.innerHTML = `<p class="weather-detail">Forecast for race time isn't available yet.</p>`;
      box.hidden = false;
      return;
    }

    // Math.max wants separate numbers, and the three dots "spread" the array into them.
    const rainChance = Math.max(...windowChances);
    const temp = Math.round(temps[start]);

    box.innerHTML = `
      <h3>Race weather</h3>
      <p class="weather-main">${describeRain(rainChance)}</p>
      <p class="weather-detail">${rainChance}% chance of rain during the race, ${temp}°C at the start</p>`;
    box.hidden = false;
  } catch (error) {
    box.innerHTML = `<p class="weather-detail">Couldn't load the weather forecast. (${error.message})</p>`;
    box.hidden = false;
  }
}

// Turns a percentage into plain words. Change the thresholds if you disagree with them.
function describeRain(chance) {
  if (chance < 20) return "Dry";
  if (chance < 50) return "Chance of rain";
  return "Rain likely";
}

// Finds the Monday (00:00 UTC) of the week the race falls in.
// getUTCDay() gives Sunday = 0 ... Saturday = 6. Adding 6 and taking the remainder
// when dividing by 7 shifts it so Monday = 0 ... Sunday = 6, i.e. "days since Monday".
// We use UTC so the answer doesn't change with your timezone: a Sunday evening race
// in the Americas is already Monday morning in some timezones, which would break it.
function getRaceWeekMonday(raceStart) {
  const daysSinceMonday = (raceStart.getUTCDay() + 6) % 7;
  return new Date(
    Date.UTC(
      raceStart.getUTCFullYear(),
      raceStart.getUTCMonth(),
      raceStart.getUTCDate() - daysSinceMonday
    )
  );
}

function formatDay(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}