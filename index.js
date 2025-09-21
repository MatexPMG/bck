const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Root route for health check
app.get('/', (req, res) => {
  res.send('Backend is running 🚂. Go to /timetables.json for data.');
});

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Serve public folder at root
app.use(express.static(publicDir));

// Start server listening on 0.0.0.0 (required for Railway)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at ${port}`);
});

// ----- GraphQL setup -----
const url = 'https://emma.mav.hu//otp2-backend/otp/routers/default/index/graphql';

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
        route {
          longName
        }
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
        tripGeometry {
          points
        }
      }
    }
  }
  `,
  variables: {}
};

// ----- Fetch timetables -----
function timetables() {
  fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(TIMES)
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.text();
    })
    .then(text => {
      const size = Buffer.byteLength(text, 'utf8') / 1000;
      const data = JSON.parse(text);
      const filePath = path.join(publicDir, 'timetables.json');

      fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
        if (err) console.error('timetables write ERROR:', err);
        else console.log(`timetables OK, downloaded ${size.toFixed(2)} kB`);
      });
    })
    .catch(err => {
      console.error('TIMES Request error:', err);
      // fallback: create empty JSON if write fails
      const filePath = path.join(publicDir, 'timetables.json');
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ data: [] }, null, 2));
        console.log('Fallback empty timetables.json created');
      }
    });
}

// Run immediately + every 60s
timetables();
setInterval(timetables, 60 * 1000);
