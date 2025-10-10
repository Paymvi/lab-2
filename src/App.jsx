import { useState } from 'react'
import './App.css'

import L from 'leaflet';

import { MapContainer, TileLayer } from 'react-leaflet';
// MapContainer: initializes and manages the Leaflet map
 
import {  Marker, Popup, useMapEvents } from 'react-leaflet';

// Note... clickhandler is outside app
function ClickHandler( { onMapClick }){
    useMapEvents({

      // e stands for "event" and is the convention in JavaScript
      // We are taking the latitude and longitude of the click and passing it to the "handleMapClick" function
      click(e) {
        onMapClick(e.latlng);
      }
    });
    return null;
  }

function App() {
  const [locations, setLocations] = useState([]);
  const [currentProvider, setCurrentProvider] = useState("osm"); // Makes sure the website defaults to osm, but the tile provider can be changed as well
  const [isDone, setIsDone] = useState(false);

  
  const [currentIcon, setCurrentIcon] = useState();

  const personaIcon = L.icon({
    iconUrl: '/pin.png',
    iconSize: [65, 35],
    iconAnchor: [20, 30],
    popupAnchor: [0, -45],

  });

  
  
  const convertToF = (c) => {
    return ((c * 9/5) + 32).toFixed(1);
  }
  const convertoC = (f) => {
    return ((f - 32) / 9/5).toFixed(1);
  }
  const convertomph = (kph) => {
    return (kph/1.6093446).toFixed(1);
  }
  

  const weatherCodes = {
  0: "Clear sky ☀️",
  1: "Mainly clear 🌤️",
  2: "Partly cloudy ⛅",
  3: "Overcast ☁️",
  45: "Fog 🌫️",
  48: "Depositing rime fog 🌫️❄️",
  51: "Light drizzle 🌦️",
  53: "Moderate drizzle 🌦️",
  55: "Dense drizzle 🌧️",
  56: "Light freezing drizzle 🌧️❄️",
  57: "Dense freezing drizzle 🌧️❄️",
  61: "Slight rain 🌧️",
  63: "Moderate rain 🌧️",
  65: "Heavy rain 🌧️🌧️",
  66: "Light freezing rain 🌧️❄️",
  67: "Heavy freezing rain 🌧️❄️❄️",
  71: "Slight snow 🌨️",
  73: "Moderate snow 🌨️🌨️",
  75: "Heavy snow ❄️❄️❄️",
  77: "Snow grains ❄️",
  80: "Slight rain showers 🌦️",
  81: "Moderate rain showers 🌦️🌦️",
  82: "Violent rain showers 🌧️🌧️",
  85: "Slight snow showers 🌨️",
  86: "Heavy snow showers ❄️❄️",
  95: "Thunderstorm ⛈️",
  96: "Thunderstorm with slight hail ⛈️🌨️",
  99: "Thunderstorm with heavy hail ⛈️🌨️❄️"
};


// It is good idea to use try catches when using APIs in case there is not info returned

  const getWeather = async (lat, lng) => {
    try {
      const res = await fetch (
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
      );
      const data = await res.json();

      return {
        temp: data.current_weather.temperature,         // Celsius
        windspeed: data.current_weather.windspeed,      // in km/hr
        weatherDescription: weatherCodes[data.current_weather.weathercode] || "Unknown",  // numeric weather code
      };

    } catch (err) {

      console.error("Failed to fetch weather info", err);
      return { temp: "N/A", windspeed: "N/A", weatherDescription: "N/A"}
      
    }

  }


  // I prompted ChatGPT to make this function with these requirements:
  // - It needs to receive an input of coordinates... NOT the name of the city
  // - It needs to locate the NEAREST city (not just a nearby city)
  // - It needs to use wikipedia was a fallback in case wikidata doesn't have a description
  // - There must be built in error checking
  // Note: Chatgpt was helpful because I did not have prior knowledge of sparql queries
  const getWikidataInfoByCoords = async (lat, lon) => {
    const endpoint = "https://query.wikidata.org/sparql";

    // SPARQL query — finds the *nearest* human settlement
    const query = `
      SELECT ?place ?placeLabel ?description ?population ?image ?wikiTitle ?distance WHERE {
        SERVICE wikibase:around {
          ?place wdt:P625 ?location .
          bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
          bd:serviceParam wikibase:radius "20" .   # search radius (km)
          bd:serviceParam wikibase:distance ?distance .
        }
        ?place wdt:P31/wdt:P279* wd:Q486972 .      # instance of human settlement
        OPTIONAL { ?place wdt:P1082 ?population. }
        OPTIONAL { ?place wdt:P18 ?image. }
        OPTIONAL {
          ?article schema:about ?place ;
                  schema:isPartOf <https://en.wikipedia.org/> ;
                  schema:name ?wikiTitle .
        }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      ORDER BY ASC(?distance)
      LIMIT 1
    `;

    try {
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(query)}&format=json`);
      const data = await res.json();

      if (!data.results.bindings.length) {
        return {
          title: "Unknown place",
          description: "No info found",
          population: "Unknown",
          image: null
        };
      }

      const result = data.results.bindings[0];
      let description = result.description?.value || "No description available";

      // Wikipedia fallback if description is missing
      if (description === "No description available" && result.wikiTitle?.value) {
        const wikiTitle = result.wikiTitle.value;
        try {
          const wikiRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
          );
          const wikiData = await wikiRes.json();
          if (wikiData.extract) description = wikiData.extract;
        } catch (wikiErr) {
          console.warn("Wikipedia summary fallback failed:", wikiErr);
        }
      }

      return {
        title: result.placeLabel?.value || "Unknown",
        description,
        population: result.population?.value
          ? Number(result.population.value).toLocaleString()
          : "Unknown",
        image: result.image?.value || null,
        distanceKm: result.distance ? parseFloat(result.distance.value).toFixed(2) : null
      };

    } catch (err) {
      console.error("Failed to fetch Wikidata info by coords:", err);
      return {
        title: "Unknown",
        description: "No info found",
        population: "Unknown",
        image: null
      };
    }
  };






  const getHumanReadableInfo = async (lat, lng) => {

    try {
      // Note: You have to use "template literals" to insert the latitude and longitude
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();

      return {
        city: data.address.city || data.address.town || data.address.village || "Unknown place",
        state: data.address.state || "Unknown",
        country: data.address.country || "Unknown",
        postcode: data.address.postcode || "N/A"
      }

    } catch (err){

      console.error("Failed to fetch location info:", err);
      return { city: "Unknown", state: "Unknown", country: "Unknown", postcode: "Unknown"}

    }
    
  }


  // Here we add to the list of locations
  // This uses lazy load
  const handleMapClick = async (latlng) => {

    // Stops it from marking up spot after clicking "done"
    if (isDone) return;

    const info = prompt("What is your favorite restaurant around here?");
    if (!info) return;

    // Get the main/basic info fast
    const basicInfo = await getHumanReadableInfo(latlng.lat, latlng.lng);

    // Make temporary maker
    const newPlace = {
      id: Date.now(),
      latlng,
      info,
      locationInfo: basicInfo,
      weather: null,
      wiki: null,
      loading: true
    }

    // Add this information immediately to the map
    setLocations((prev) => [...prev, newPlace]);

    // Fetch the slower stuff in the background
    try {
      const [weather, wiki] = await Promise.all([
        // getHumanReadableInfo(latlng.lat, latlng.lng),
        getWeather(latlng.lat, latlng.lng),
        getWikidataInfoByCoords(latlng.lat, latlng.lng)
      ]);
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === newPlace.id
          ? {...loc, weather, wiki, loading: false}
          : loc
        )
      );

    } catch (err) {
      console.error("Error loading the extra info", err);
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === newPlace.id
            ? { ...loc, weather: null, wiki: null, loading: false}
            : loc
        )
      );

    }


  };

  
  const handleEdit = (id) => {
    const newInfo = prompt("What is your (new) fav resteraunt? ")
    if (newInfo){
      setLocations(prev =>
        prev.map(loc =>
          loc.id === id ? { ...loc, info: newInfo } : loc
        )
      );
    }
  };


  const handleDelete = (id) => {
    // Filter out the locations without that id
    setLocations(prev => prev.filter(loc => loc.id !== id))
  };



  // Stores information for the different map styles (tile providers)
  const tileProviders = {
    osm: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    },
    carto: {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
    esri: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',

    }

  }





  return (
    
    <div style={{ height: '100vh', width: '100vw'}}>
    
        {/* This is where the map lives */}
        <MapContainer
          center={[43.03859371008897, -71.44920665422427]} // SNHU coordinates
          zoom={15.5}
          style={{ height: '90%', width: '90%'}}
        >

        {/* TileLayer defines the source of the map imagery */}
        <TileLayer
          attribution={tileProviders[currentProvider].attribution}
          url={tileProviders[currentProvider].url}
          
          detectRetina={true} // << UNDERRATED: Makes the map higher resolution

        />


        <ClickHandler onMapClick={handleMapClick} />
        {locations.map((loc, i) => (
          <Marker key={i} position={loc.latlng} icon={currentIcon || personaIcon}>
            <Popup>
              <strong>{loc.info}</strong>
              <br/>
              {loc.locationInfo?.city}, {loc.locationInfo?.state} <br/>
              {loc.locationInfo?.country}
              <br/>


              {loc.loading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="spinner" />
                  <em>Loading more info 👀...</em>
                </div>
                
              ) : (
                <>
                  {loc.weather && (
                    <>
                    Temp: {convertToF(loc.weather?.temp)}°F<br/>
                    Windspeed: {convertomph(loc.weather?.windspeed)}mph<br/>
                    Weather: {loc.weather?.weatherDescription}<br/>
                    </>
                  )}
                
                {loc.wiki &&
                  <>
                  Population: {loc.wiki?.population}<br/><br/>
                  {loc.wiki?.image && <img src={loc.wiki?.image} alt={loc.wiki?.title} width="150" />}<br/>
                  {loc.wiki?.description}<br/>
                  </>
                }

                </>

              )}

              
              
            </Popup>
          </Marker>
        ))}



        <div className="buttons">
          <button onClick={(e) => setCurrentProvider("osm")}>OSM</button>
          <button onClick={() => setCurrentProvider("carto")}>CARTO</button>
          <button onClick={() => setCurrentProvider("esri")}>ESRI</button>
          
          {/* "Done" button */}
          <button onClick={() => setIsDone(true)}>DONE</button>
        </div>


        <div>
          <button onClick={() => setCurrentIcon()}></button>
        </div>

        

        
        {/* conditional rendering */}
        {!isDone && (
        <div className="sidebar">
          <h3>Favorite restaurants</h3>
          <ul>
            {locations.map((loc) => (
              <li key={loc.id}>

                {/* You need {} to evaluate JSX expressions */}
                {loc.locationInfo.city}, {loc.locationInfo.state} : {loc.info}
                <button className="edit" onClick={(e) => {e.stopPropagation(); handleEdit(loc.id)}}>Edit</button>
                <button className="delete" onClick={(e) => {e.stopPropagation(); handleDelete(loc.id)}}>x</button>
              </li>
            ))}
          </ul>
        </div>
        )}

        

      </MapContainer>
    
    </div>
  );
}

export default App
