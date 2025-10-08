import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

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
  

  // Here we add to the list of locations
  const handleMapClick = (latlng) => {

    const info = prompt("What is your favorite restaurant around here?");
    if (!info) return;

    // We want to store both the coordinates and the info description and add it to the location list
    const newPlace = { latlng, info }
    setLocations((prev) => [...prev, newPlace])

  };


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
          <Marker key={i} position={loc.latlng}>
            <Popup>{loc.info}</Popup>
          </Marker>
        ))}



        <div style={{ position: "absolute", top: 10, right: 90, zIndex: 999}} >
          <button onClick={() => setCurrentProvider("osm")}>OSM</button>
          <button onClick={() => setCurrentProvider("carto")}>CARTO</button>
          <button onClick={() => setCurrentProvider("esri")}>ESRI</button>
        </div>



        <div className="sidebar">
          <h3>Favorite restaurants</h3>
          <ul>
            {locations.map((loc, i) => (
              <li key={i}>
                ({loc.latlng.lat.toFixed(2)}, {loc.latlng.lng.toFixed(2)}): {loc.info}
              </li>
            ))}
          </ul>
        </div>

        

      </MapContainer>
    
    </div>
  );
}

export default App
