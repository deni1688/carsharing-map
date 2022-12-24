import { useState } from 'react';
import { LoadScript, GoogleMap, MarkerF } from '@react-google-maps/api';
import useSWR from 'swr';
import mapStyles from './mapStyles.json';

const containerStyle = {
    width: '100%',
    height: '500px'
};

const center = {
    lat: 48.766666,
    lng: 11.433333
};

const options = {
    streetViewControl: false,
    mapTypeControl: false,
    panControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: mapStyles,
    maxZoom: 20,
    minZoom: 6
};

interface Vehicle {
    id: number;
    brand: string;
    model: string;
    year: number;
    available: boolean;
    position: number[];
}

const fetcher = (resource: string) => fetch(`http://localhost:3000/${resource}`)
    .then((res) => res.json()) as Promise<Vehicle[]>;

function App() {
    const [zoom, setZoom] = useState(options.minZoom);

    const { data, error, isLoading } = useSWR('vehicles', fetcher);

    if (error) {
        return <div className="container pt-5">Error loading data</div>;
    }

    return (
        <div className="container pt-5">
            <h1>CarSharing Map</h1>
            <div className="col-12">
                {
                    isLoading
                        ? <h2>Loading...</h2>
                        : <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                options={options}
                                center={center}
                                zoom={zoom}
                            >
                                {data?.map(vehicle => <MarkerF
                                    key={vehicle.id}
                                    position={{ lat: vehicle.position[0], lng: vehicle.position[1] }} />
                                )}
                            </GoogleMap>
                        </LoadScript>
                }
            </div>
        </div>
    )
}

export default App
