let localBirdData = [];
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
        let nearByBird = {
            birdName : bird.comName,
            location : bird.locName,
            volume : bird.howMany,
            lat : bird.lat,
            long : bird.long,
            image : birdInfo.images[0] ? birdInfo.images[0]:"",
            family : birdInfo.family,
            status : birdInfo.status,
            wingSpan : birdInfo.wingspanMax
        }
        localBirdData.push(nearByBird)
    })
    localBirdData.forEach( bird =>{
        console.log(bird)
    })
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