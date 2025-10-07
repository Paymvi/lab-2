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

  // Here we add to the list of locations
  const handleMapClick = (latlng) => {
    setLocations((prev) => [...prev, {latlng}])
  };



  return (
    
    <div style={{ height: '100vh', width: '100vw'}}>
    
        {/* This is where the map lives */}
        <MapContainer
          center={[43.03859371008897, -71.44920665422427]} // SNHU coordinates
          zoom={15.5}
          style={{ height: '100%', width: '100%'}}
        >

        {/* TileLayer defines the source of the map imagery */}
        {/* We are using OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          
          detectRetina={true} // << UNDERRATED: Makes the map higher resolution

        />

        <ClickHandler onMapClick={handleMapClick} />
        {locations.map((loc, i) => (
          <Marker key={i} position={loc.latlng}>
            
          </Marker>
        ))}
        

      </MapContainer>
    
    </div>
  );
}

export default App
