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

  // Here we add to the list of locations
  const handleMapClick = (latlng) => {

    // Stops it from marking up spot after clicking "done"
    if (isDone) return;

    const info = prompt("What is your favorite restaurant around here?");
    if (!info) return;

    // We want to store both the coordinates and the info description and add it to the location list
    const newPlace = { id: Date.now(), latlng, info }
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
            <Popup>{loc.info}</Popup>
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
                ({loc.latlng.lat.toFixed(2)}, {loc.latlng.lng.toFixed(2)}): {loc.info}
                <button class="edit" onClick={(e) => {e.stopPropagation(); handleEdit(loc.id)}}>Edit</button>
                <button class="delete" onClick={(e) => {e.stopPropagation(); handleDelete(loc.id)}}>x</button>
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
