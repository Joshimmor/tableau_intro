let localBirdData = [];
const columns = []
document.getElementById('fetchBirdsBtn').addEventListener('click', async () => {
const zip = document.getElementById('zipInput').value.trim();
const locationStatus = document.getElementById('locationStatus');
  if (!zip) {
      locationStatus.textContent = "❗ Please enter a ZIP code.";
      return;
    }
 locationStatus.textContent = "📍 Looking up location...";
  try {
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!geoRes.ok) throw new Error("Invalid ZIP");
    const geoData = await geoRes.json();
    const { latitude, longitude } = geoData.places[0];
    locationStatus.textContent = `📍 Lat: ${latitude}, Lon: ${longitude}`;
    // Now fetch birds from eBird
    const birdRes = await fetch(`https://api.ebird.org/v2/data/obs/geo/recent?back=1&dist=2&lat=${latitude}&lng=${longitude}`, {
      headers: {
        "X-eBirdApiToken": "2sfdah9jaj1k"
      }
    });
    const birdData = await birdRes.json();

    birdData.forEach(async bird => {
        let birdInfo = await getBirdData(bird.comName);
        let nearByBird = [
            bird.comName,
            bird.locName,
            bird.howMany,
            bird.lat,
            bird.lng,
            birdInfo.images[0] ? birdInfo.images[0]:"",
            birdInfo.family,
            birdInfo.status,
            birdInfo.wingspanMax
        ]
        localBirdData.push(nearByBird)
    })
    localBirdData.forEach( bird =>{
      dataTable.addRow(bird);
    })
    tableau.extensions.dashboardContent.dashboard.publishDataSourceAsync({
      id: "BirdObservations",
      tables: [dataTable]
    }).then(() => {
      console.log("✅ Bird data published to Tableau.");
    }).catch(err => {
      console.error("❌ Failed to publish data:", err.message);
    });
  } catch (err) {
    locationStatus.textContent = "❌ Error: " + err.message;
  } 
});
// Obtain bird info from nuthatch
async function getBirdData(name){
  const key = "e558c1b4-c686-4607-8808-6f2a3a2d4279"
  const birdInfo = await fetch("https://nuthatch.lastelm.software/v2/birds?name="+name,
    {  
      headers:{
           'api-key': key            
        }
    }).then((res) => {
      if (!res.ok) {
        throw new Error('Network response was not OK');
      }
      return res.json();
    }).then((data) =>{
        return data["entities"][0];
    }).catch(err => console.error(err))
    return birdInfo;
}

function main(){
    // Run only if we're in Tableau
    const output = document.getElementById('location');
    const log = (...args) => {
      console.log('[DEBUG]', ...args);
    };
    if (window.tableau) {
        tableau.extensions.initializeAsync().then(() => {
            log('Running inside Tableau');
            const dataTable = new tableau.Table(columns);
            columns = [
              { id: "birdName", dataType: tableau.dataTypeEnum.string },
              { id: "location", dataType: tableau.dataTypeEnum.string },
              { id: "volume", dataType: tableau.dataTypeEnum.int},
              { id: "lat", dataType: tableau.dataTypeEnum.float },
              { id: "long", dataType: tableau.dataTypeEnum.float },
              { id: "image", dataType: tableau.dataTypeEnum.string },
              { id: "family", dataType: tableau.dataTypeEnum.string },
              { id: "status", dataType: tableau.dataTypeEnum.string },
              { id: "wingspan", dataType: tableau.dataTypeEnum.float }
            ];
        }).catch(err => {
            output.textContent = `Extension failed to initialize: ${err.message}`;
            log('Initialization error:', err);
          });
        } else {
          log('⚠️ Not running inside Tableau. Skipping initializeAsync.');
          output.textContent = "This extension must be run in Tableau.";
    }
}
main()