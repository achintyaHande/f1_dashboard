// circuit-data.js
// Reference data that barely changes, so we write it by hand instead of fetching it.
//
// Why is this a .js file and not a .json file? Browsers refuse to fetch() files from your
// own disk when you open index.html by double-clicking it (a safety rule), but a <script>
// tag can load a local .js file just fine. So the data lives in a JS variable.
//
// The keys are the circuit ids Jolpica uses (race.Circuit.circuitId in the schedule data).
//
//   trackId     = file name of the track outline in github.com/bacinger/f1-circuits
//   lengthKm    = lap length in km
//   turns       = number of corners
//   elevationM  = height difference between the circuit's highest and lowest point, in metres
//                 (null = no figure yet, the page just leaves it out)
//
// Where the numbers come from:
//   - elevationM: Formula1.com's article "Highs and lows - which F1 track has the most
//     elevation changes?" (2016). Circuits that article doesn't cover are null.
//   - lengthKm and turns: written from memory for the current layouts, NOT checked against
//     a source. Treat them as approximate and correct anything you find wrong.
//
// To add or fix a circuit, edit one line. If the page logs "No circuit data for ..." in the
// browser console, copy that id into this list.

const CIRCUIT_DATA = {
  albert_park:   { trackId: "au-1953", lengthKm: 5.278, turns: 14, elevationM: 2.6 },
  shanghai:      { trackId: "cn-2004", lengthKm: 5.451, turns: 16, elevationM: 7.4 },
  suzuka:        { trackId: "jp-1962", lengthKm: 5.807, turns: 18, elevationM: 40.4 },
  bahrain:       { trackId: "bh-2002", lengthKm: 5.412, turns: 15, elevationM: 16.9 },
  jeddah:        { trackId: "sa-2021", lengthKm: 6.174, turns: 27, elevationM: null },
  miami:         { trackId: "us-2022", lengthKm: 5.412, turns: 19, elevationM: null },
  villeneuve:    { trackId: "ca-1978", lengthKm: 4.361, turns: 14, elevationM: 5.2 },
  monaco:        { trackId: "mc-1929", lengthKm: 3.337, turns: 19, elevationM: 42 },
  catalunya:     { trackId: "es-1991", lengthKm: 4.657, turns: 14, elevationM: 29.6 },
  red_bull_ring: { trackId: "at-1969", lengthKm: 4.318, turns: 10, elevationM: 63.5 },
  silverstone:   { trackId: "gb-1948", lengthKm: 5.891, turns: 18, elevationM: 11.3 },
  spa:           { trackId: "be-1925", lengthKm: 7.004, turns: 19, elevationM: 102.2 },
  hungaroring:   { trackId: "hu-1986", lengthKm: 4.381, turns: 14, elevationM: 34.7 },
  zandvoort:     { trackId: "nl-1948", lengthKm: 4.259, turns: 14, elevationM: null },
  monza:         { trackId: "it-1922", lengthKm: 5.793, turns: 11, elevationM: 12.8 },
  madring:       { trackId: "es-2026", lengthKm: 5.47,  turns: 22, elevationM: null },
  baku:          { trackId: "az-2016", lengthKm: 6.003, turns: 20, elevationM: 26.8 },
  marina_bay:    { trackId: "sg-2008", lengthKm: 4.94,  turns: 19, elevationM: 5.3 },
  americas:      { trackId: "us-2012", lengthKm: 5.513, turns: 20, elevationM: 30.9 },
  rodriguez:     { trackId: "mx-1962", lengthKm: 4.304, turns: 17, elevationM: 2.8 },
  interlagos:    { trackId: "br-1940", lengthKm: 4.309, turns: 15, elevationM: 43 },
  vegas:         { trackId: "us-2023", lengthKm: 6.201, turns: 17, elevationM: null },
  losail:        { trackId: "qa-2004", lengthKm: 5.419, turns: 16, elevationM: null },
  yas_marina:    { trackId: "ae-2009", lengthKm: 5.281, turns: 16, elevationM: 10.7 },
};