import { useEffect, useRef, useState } from 'react';
import { LoadScript, GoogleMap, MarkerF, OverlayViewF, OverlayView } from '@react-google-maps/api';
import Supercluster, { ClusterFeature, PointFeature } from 'supercluster';
import useSWR from 'swr';
import mapStyles from './mapStyles.json';

const containerStyle = { width: '100%', height: '500px' };
const center = { lat: 48.766666, lng: 11.433333 };
const options = {
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    styles: mapStyles,
    maxZoom: 20,
    minZoom: 6
};

const sc = new Supercluster({ radius: 40, maxZoom: options.maxZoom });

type Map = google.maps.Map & { zoom: number };

interface Vehicle {
    id: number;
    brand: string;
    model: string;
    year: number;
    available: boolean;
    position: number[];
}

function fetcher(resource: string) {
    return fetch(`http://localhost:3000/${resource}`)
        .then((res) => res.json()) as Promise<Vehicle[]>
};

function formatDataToGeoJsonPoints(data: Vehicle[]): GeoJSON.Feature<GeoJSON.Point>[] {
    return data.map((vehicle) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [vehicle.position[1], vehicle.position[0]] },
        properties: { cluster: false, ...vehicle }
    }));
}

function getLabel(pointCount: number): google.maps.MarkerLabel {
    return { text: pointCount.toString(), color: '#fff' };
}


function App() {
    const [zoom, setZoom] = useState<number>(options.minZoom);
    const [bounds, setBounds] = useState<GeoJSON.BBox>([0, 0, 0, 0]);
    const [clusters, setClusters] = useState<ClusterFeature<any>[]>();
    const mapRef = useRef<Map>();
    const { data, error, isLoading } = useSWR('vehicles', fetcher);

    useEffect(() => {
        if (data?.length && mapRef.current) {
            sc.load(formatDataToGeoJsonPoints(data) as PointFeature<GeoJSON.Feature<GeoJSON.Point>>[]);
            setClusters(sc.getClusters(bounds, zoom));
        }
    }, [data, bounds, zoom]);

    if (error) {
        return <div className="container pt-5">
            <h2 className="text-center">Error loading data</h2>
        </div>;
    }

    if (isLoading) {
        return <div className="container pt-5">
            <h2 className="text-center">Loading...</h2>
        </div>;
    }

    function handleClusterClick({ id, lat, lng }: { id: number, lat: number, lng: number }) {
        const expansionZoom = Math.min(sc.getClusterExpansionZoom(id), 20);
        mapRef.current?.setZoom(expansionZoom);
        mapRef.current?.panTo({ lat, lng });
    }

    function handleBoundsChanged() {
        if (mapRef.current) {
            const bounds = mapRef.current.getBounds()?.toJSON();
            setBounds([bounds?.west || 0, bounds?.south || 0, bounds?.east || 0, bounds?.north || 0]);
        }
    }

    function handleZoomChanged() {
        if (mapRef.current) {
            setZoom(mapRef.current?.zoom);
        }
    }

    function handleMapLoad(map: google.maps.Map) {
        mapRef.current = map as Map;
    }

    return (
        <div className="container pt-5">
            <h1>CarSharing Map</h1>
            <div className="col-12">
                <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        onLoad={handleMapLoad}
                        onBoundsChanged={handleBoundsChanged}
                        onZoomChanged={handleZoomChanged}
                        mapContainerStyle={containerStyle}
                        options={options}
                        center={center}
                        zoom={zoom}
                    >
                        {clusters?.map(({ id, geometry, properties }) => {
                            const [lng, lat] = geometry.coordinates;
                            const { cluster: isCluster, point_count: pointCount } = properties;

                            return isCluster
                                ? <MarkerF
                                    key={`cluster-${id}`}
                                    onClick={() => handleClusterClick({ id: id as number, lat, lng })}
                                    position={{ lat, lng }}
                                    icon="/images/cluster-pin.png"
                                    label={getLabel(pointCount)} />
                                : <CustomMarker
                                    key={`vehicle-${properties.id}`}
                                    position={{ lat, lng }} />
                        })}
                    </GoogleMap>
                </LoadScript>
            </div>
        </div>
    )
}

function getPixelPositionOffset(width, height) {
    return {x: -(width / 2), y: -(height / 2)};
}

function CustomMarker({ position }) {
    return <OverlayViewF
        position={position}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        getPixelPositionOffset={getPixelPositionOffset}>
        <button className="btn btn-none" onClick={() => alert(Object.values(position))}>
            <img src="/images/cs-pin.png" alt="CarSharing Pin" />
        </button>
    </OverlayViewF>
}

export default App
