import { useState } from 'react';
import { LoadScript, GoogleMap } from '@react-google-maps/api';
import  mapStyles from './mapStyles.json';

const containerStyle = {
    width: '100%',
    height: '500px'
};

const center = {
    lat: 48.137154,
    lng: 11.576124
};

const options = {
    streetViewControl: false,
    mapTypeControl: false,
    panControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: mapStyles,
    maxZoom: 20,
    minZoom: 8
};

function App() {
    const [zoom, setZoom] = useState(options.minZoom);

    return (
        <div className="container pt-5">
            <h1>CarSharing Map</h1>
            <div className="col-12">
                <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        options={options}
                        center={center}
                        zoom={zoom}
                    >
                    </GoogleMap>
                </LoadScript>
            </div>
        </div>
    )
}

export default App
