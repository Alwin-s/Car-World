import { useEffect } from 'react';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

export type MapView = { lat: number; lng: number; zoom: number };

const pinIcon = divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#fbbf24;border:3px solid #1e1b4b;transform:rotate(-45deg)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 26],
});

function ViewController({ view }: { view: MapView }) {
  const map = useMap();
  useEffect(() => {
    map.setView([view.lat, view.lng], view.zoom);
  }, [map, view]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

type Props = {
  view: MapView;
  marker: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
};

export function LocationPicker({ view, marker, onPick }: Props) {
  return (
    <MapContainer
      center={[view.lat, view.lng]}
      zoom={view.zoom}
      scrollWheelZoom
      className="z-0 h-72 w-full rounded-lg"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ViewController view={view} />
      <ClickHandler onPick={onPick} />
      {marker && <Marker position={[marker.lat, marker.lng]} icon={pinIcon} />}
    </MapContainer>
  );
}