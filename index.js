const express = require('express');
const fs = require('fs');

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});

const url = 'https://emma.mav.hu//otp2-backend/otp/routers/default/index/graphql'; // replace with your real endpoint

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

function timetables() {

  fetch(url, {
  method: 'POST',
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'access-control-allow-origin': 'https://emma.mav.hu',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(TIMES)
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.text(); // Read as text first so we can measure size
    })
    .then(text => {
      const size = (Buffer.byteLength(text, 'utf8'))/1000;
      const data = JSON.parse(text); // Now safely parse it

      fs.writeFile('/public/timetables.json', JSON.stringify(data, null, 2), err => {
        if (err) {
          console.error('timetables write ERROR:', err);
        } else {
          console.log(`timetables OK, downloaded ${size} kB`);
        }
      });
    })
    .catch(err => {
      console.error('TIMES Request error:', err);
    });
}

timetables();

setInterval(timetables, 60*1000);