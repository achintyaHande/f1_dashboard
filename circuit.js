// circuit.js
// Job: for the NEXT race, show the circuit's stats and draw its layout.
// Like weather.js, this doesn't run by itself: schedule.js calls loadCircuit(race)
// once it knows which race is next.
//
// Two data sources:
//   1. circuit-data.js (CIRCUIT_DATA): stats we wrote by hand, available instantly.
//   2. The track outline: a GeoJSON file from the open-source bacinger/f1-circuits repo.
//      GeoJSON stores a shape as a list of [longitude, latitude] points.
//      We fetch that list and turn it into an SVG drawing ourselves.

const TRACK_URL_BASE =
  "https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/";

// Size of the drawing area, in SVG units (the SVG scales to fit the page; these are just
// the coordinate system we draw in).
const MAP_WIDTH = 300;
const MAP_HEIGHT = 200;
const MAP_PADDING = 14;

async function loadCircuit(race) {
  const box = document.getElementById("circuit");
  const circuitId = race.Circuit.circuitId;

  // Look the circuit up in our hand-written table.
  const info = CIRCUIT_DATA[circuitId];
  if (!info) {
    // Not in the table: leave the box hidden and leave a note for ourselves.
    console.warn("No circuit data for", circuitId, "- add it to circuit-data.js");
    return;
  }

  // Stats need no network, so draw the card straight away with a placeholder for the map.
  box.innerHTML = `
    <h3>Track layout</h3>
    <div class="track-map">Loading layout…</div>
    <div class="stats">${renderStats(info)}</div>
    <p class="credit">Layout data: bacinger/f1-circuits (unofficial)</p>`;
  box.hidden = false;

  // Now fetch the outline and swap it in for the placeholder.
  const map = box.querySelector(".track-map");
  try {
    const response = await fetch(`${TRACK_URL_BASE}${info.trackId}.geojson`);
    if (!response.ok) {
      throw new Error("Server replied " + response.status);
    }

    const geojson = await response.json();
    map.innerHTML = buildTrackSvg(getTrackPoints(geojson));
  } catch (error) {
    // The stats stay visible even if the drawing fails.
    map.textContent = "Track layout isn't available right now.";
    console.warn("Track layout failed:", error);
  }
}

// Builds the row of stat blocks (length, turns, elevation change).
function renderStats(info) {
  const stats = [
    { value: info.lengthKm.toFixed(3) + " km", label: "Lap length" },
    { value: info.turns, label: "Turns" },
  ];

  // Only show elevation if we have a figure for this circuit.
  if (info.elevationM !== null) {
    stats.push({ value: info.elevationM + " m", label: "Elevation change" });
  }

  return stats
    .map(
      (stat) => `
      <div class="stat">
        <span class="stat-value">${stat.value}</span>
        <span class="stat-label">${stat.label}</span>
      </div>`
    )
    .join("");
}

// Pulls the list of [longitude, latitude] points out of the GeoJSON.
// GeoJSON files come in a few wrappers, so we unwrap whichever one this file uses
// instead of assuming a single shape.
function getTrackPoints(geojson) {
  let geometry = geojson;

  if (geojson.type === "FeatureCollection") {
    geometry = geojson.features[0].geometry;
  } else if (geojson.type === "Feature") {
    geometry = geojson.geometry;
  }

  if (geometry.type === "LineString") {
    return geometry.coordinates;
  }
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates.flat(); // join the separate pieces into one list
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0]; // the outer ring
  }

  throw new Error("Unexpected track shape: " + geometry.type);
}

// Turns the list of points into an <svg> string.
// The main problem: points are in degrees of longitude/latitude, but the screen wants
// x/y positions. So we find the track's bounding box, then scale and shift every point
// so the whole track fits and is centred in our MAP_WIDTH x MAP_HEIGHT area.
function buildTrackSvg(points) {
  const lngs = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // A degree of longitude is shorter than a degree of latitude away from the equator
  // (the meridians squeeze together toward the poles). Multiplying longitude by
  // cos(latitude) corrects for that, so the track isn't stretched sideways.
  const midLat = (minLat + maxLat) / 2;
  const lngCorrection = Math.cos((midLat * Math.PI) / 180);

  const trackWidth = (maxLng - minLng) * lngCorrection;
  const trackHeight = maxLat - minLat;

  // One scale factor for both directions keeps the shape's proportions.
  // We take the smaller of the two so the track fits in both width and height.
  const scale = Math.min(
    (MAP_WIDTH - 2 * MAP_PADDING) / trackWidth,
    (MAP_HEIGHT - 2 * MAP_PADDING) / trackHeight
  );

  // Extra space left over on each side, used to centre the drawing.
  const offsetX = (MAP_WIDTH - trackWidth * scale) / 2;
  const offsetY = (MAP_HEIGHT - trackHeight * scale) / 2;

  // Each point becomes "M x y" (move to, for the first point) or "L x y" (line to).
  const path = points
    .map((point, index) => {
      const x = offsetX + (point[0] - minLng) * lngCorrection * scale;
      // Latitude grows going north (up), but SVG's y grows going DOWN, so we flip it.
      const y = offsetY + (maxLat - point[1]) * scale;
      return (index === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    })
    .join(" ");

  // "Z" closes the loop back to the first point.
  return `
    <svg viewBox="0 0 ${MAP_WIDTH} ${MAP_HEIGHT}" role="img" aria-label="Track layout">
      <path d="${path} Z"></path>
    </svg>`;
}