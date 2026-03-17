import React, { useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DELIVERY_MAP_CENTER, DELIVERY_MAP_ZOOM } from '../constants/deliveryZone';
import './AddressMapPicker.css';

/** Ícono de marcador por defecto (Leaflet no lo incluye en el bundle correctamente en algunos entornos) */
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/**
 * Permite al usuario elegir una ubicación en el mapa (para que el admin identifique la dirección).
 * @param {{ latitude: number | null, longitude: number | null, onLocationChange: (lat: number, lng: number) => void }} props
 */
export default function AddressMapPicker({ latitude, longitude, onLocationChange }) {
  const position = useMemo(() => {
    if (latitude != null && longitude != null) return [latitude, longitude];
    return null;
  }, [latitude, longitude]);

  const mapCenter = position || [DELIVERY_MAP_CENTER.lat, DELIVERY_MAP_CENTER.lng];

  return (
    <div className="address-map-picker">
      <p className="address-map-picker-hint">
        Haz clic en el mapa para marcar la ubicación de tu domicilio. Así podemos identificar mejor tu dirección.
      </p>
      <div className="address-map-picker-map-wrap">
        <MapContainer
          center={mapCenter}
          zoom={DELIVERY_MAP_ZOOM}
          className="address-map-picker-map"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationChange={onLocationChange} />
          {position && (
            <Marker
              position={position}
              icon={defaultIcon}
              eventHandlers={{ dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                onLocationChange(lat, lng);
              } }}
              draggable
            />
          )}
        </MapContainer>
      </div>
      {position && (
        <p className="address-map-picker-coords" aria-live="polite">
          Ubicación: {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
        </p>
      )}
    </div>
  );
}

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click: useCallback(
      (e) => {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      },
      [onLocationChange]
    ),
  });
  return null;
}
