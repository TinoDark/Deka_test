'use client';

import { useEffect, useRef, useState } from 'react';

interface MapComponentProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function MapComponent({
  onLocationSelect,
  initialLocation = { lat: 3.8667, lng: 11.5167 },
  height = '400px',
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: selectedLocation,
      mapTypeControl: false,
      streetViewControl: false,
    });

    const newMarker = new window.google.maps.Marker({
      position: selectedLocation,
      map: newMap,
      title: 'Delivery location',
      draggable: true,
    });

    newMarker.addListener('dragend', (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      updateLocation({ lat, lng }, newMap, newMarker);
    });

    newMap.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateLocation({ lat, lng }, newMap, newMarker);
    });

    setMap(newMap);
    setMarker(newMarker);
  };

  const updateLocation = async (location: any, map: any, marker: any) => {
    setSelectedLocation(location);
    marker.setPosition(location);
    map.setCenter(location);

    if (!window.google?.maps?.Geocoder) return;

    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location });
      const address = result.results[0]?.formatted_address || 'Adresse sélectionnée';

      if (onLocationSelect) {
        onLocationSelect({ lat: location.lat, lng: location.lng, address });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation({ lat: latitude, lng: longitude }, map, marker);
        },
        () => {
          alert('Autorisez la localisation ou cliquez sur la carte pour sélectionner un emplacement.');
        },
      );
    }
  };

  return (
    <div>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height,
          borderRadius: '16px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb',
        }}
      />
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Utiliser ma position actuelle
      </button>
      <p className="text-sm text-gray-600 mt-2">
        Selected: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
      </p>
    </div>
  );
}
