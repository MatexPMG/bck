const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch'); // make sure node-fetch@2 is installed

const app = express();
const port = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static('public'));

// GraphQL API endpoint
const url = 'https://emma.mav.hu/otp2-backend/otp/routers/default/index/graphql';

// Queries
const VEHICLES = {
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
        trip {
          tripHeadsign
          tripShortName
        }
        nextStop {
          arrivalDelay
        }
      }
    }
  `,
  variables: {}
};

const TIMES = {
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

// Fetch functions
async function fetchAndWrite(queryObj, fileName) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryObj)
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const text = await res.text();
    const size = Buffer.byteLength(text, 'utf8') / 1000;
    const data = JSON.parse(text);

    fs.writeFile(`public/${fileName}`, JSON.stringify(data, null, 2), err => {
      if (err) console.error(`${fileName} write ERROR:`, err);
      else console.log(`${fileName} OK, downloaded ${size.toFixed(1)} kB`);
    });
  } catch (err) {
    console.error(`${fileName} Request error:`, err);
  }
}

// Initial fetch
fetchAndWrite(VEHICLES, 'trains.json');
fetchAndWrite(TIMES, 'timetables.json');

// Intervals
setInterval(() => fetchAndWrite(VEHICLES, 'trains.json'), 15 * 1000);
setInterval(() => fetchAndWrite(TIMES, 'timetables.json'), 60 * 1000);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});