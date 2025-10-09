import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
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

  
  // It is good idea to use try catches when using APIs in case there is not info returned

  const convertToF = (c) => {
    return ((c * 9/5) + 32).toFixed(1);
  }
  const convertoC = (f) => {
    return ((f - 32) / 9/5).toFixed(1);
  }
  
  const getWeather = async (lat, lng) => {
    try {
      const today = new Date();
      today.setDate(today.getDate() - 4);

      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0');

      // You need to use backticks to interpolate variables
      const dateStr = `${yyyy}${mm}${dd}`

      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?start=${dateStr}&end=${dateStr}&latitude=${lat}&longitude=${lng}&community=RE&parameters=T2M_MAX,T2M_MIN&format=JSON`;

      const res = await fetch(url);
      const data = await res.json();

      const dailyData = data.properties.parameter;
      let maxTemp = dailyData.T2M_MAX[dateStr];
      let minTemp = dailyData.T2M_MIN[dateStr];

      // If the API returned -999, mark as unknown
      if (maxTemp === -999) maxTemp = "N/A";
      if (minTemp === -999) minTemp = "N/A";

      return {
        maxTemp,
        minTemp
      }

    } catch (err) {
      console.error("Failed to fetch NASA POWER information for the weather", err);
      return {
        maxTemp: "N/A",
        minTemp: "N/A"
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
  const handleMapClick = async (latlng) => {

    // Stops it from marking up spot after clicking "done"
    if (isDone) return;

    const info = prompt("What is your favorite restaurant around here?");
    if (!info) return;

    const locationInfo = await getHumanReadableInfo(latlng.lat, latlng.lng);
    const weather = await getWeather(latlng.lat, latlng.lng);

    const newPlace = { id: Date.now(), latlng, info, locationInfo, weather }

    // We want to store both the coordinates and the info description and add it to the location list
    setLocations((prev) => [...prev, newPlace])


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
              {loc.locationInfo.city}, {loc.locationInfo.state} <br/>
              {loc.locationInfo.country}
              <br/>
              Max temp: {convertToF(loc.weather.maxTemp)}°F<br/>
              Min temp: {convertToF(loc.weather.minTemp)}°F
            
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
