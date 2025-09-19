const express = require('express');
const fetch = require('node-fetch'); // node-fetch@2

const app = express();
const port = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static('public'));

// GraphQL API endpoint
const url = 'https://emma.mav.hu/otp2-backend/otp/routers/default/index/graphql';

// Timetables query
const TIMETABLES_QUERY = {
  query: `
    {
      vehiclePositions(
        swLat: 45.74573822516341,
        swLon: 16.21031899279769,
        neLat: 48.56368661139524,
        neLon: 22.906741803509043,
        modes: [RAIL, TRAMTRAIN]
      ) {
        vehicleId
        lat
        lon
        heading
        speed
        lastUpdated
        nextStop {
          arrivalDelay
        }
        trip {
          alerts(types: [ROUTE, TRIP]) {
            alertDescriptionText
          }
          tripShortName
          tripHeadsign
          wheelchairAccessible
          bikesAllowed
          route { longName }
          stoptimes {
            stop {
              name
              lat
              lon
              platformCode
            }
            scheduledArrival
            arrivalDelay
            scheduledDeparture
            departureDelay
          }
          tripGeometry { points }
        }
      }
    }
  `,
  variables: {}
};

// In-memory cache
let latestData = null;
let lastUpdated = null;

// Fetch timetables from API
async function fetchTimetables() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TIMETABLES_QUERY)
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();
    latestData = data;
    lastUpdated = new Date().toISOString();
    console.log(`[${lastUpdated}] Timetables updated`);
  } catch (err) {
    console.error('Error fetching timetables:', err);
  }
}

// Initial fetch
fetchTimetables();

// Refresh every 60 seconds
setInterval(fetchTimetables, 60 * 1000);

// API endpoint
app.get('/api/timetables', (req, res) => {
  if (latestData) {
    res.json({
      timestamp: lastUpdated,
      data: latestData
    });
  } else {
    res.status(503).json({ error: 'Data not available yet' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});