'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface MapComponentProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  initialLocation?: { lat: number; lng: number };
  height?: string;
}

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GoogleMouseEvent = {
  latLng: GoogleLatLng;
};

type GoogleLatLngLiteral = {
  lat: number;
  lng: number;
};

type GoogleMapInstance = {
  setCenter: (location: GoogleLatLngLiteral) => void;
  addListener: (event: string, callback: (event: GoogleMouseEvent) => void) => void;
};

type GoogleMarkerInstance = {
  setPosition: (location: GoogleLatLngLiteral) => void;
  addListener: (event: string, callback: (event: GoogleMouseEvent) => void) => void;
};

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
        Marker: new (options: Record<string, unknown>) => GoogleMarkerInstance;
        Geocoder: new () => {
          geocode: (request: { location: GoogleLatLngLiteral }) => Promise<{ results: Array<{ formatted_address?: string }> }>;
        };
      };
    };
  }
}

export function MapComponent({
  onLocationSelect,
  initialLocation = { lat: 3.8667, lng: 11.5167 },
  height = '400px',
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const initialMapPosition = useRef(initialLocation);
  const [map, setMap] = useState<GoogleMapInstance | null>(null);
  const [marker, setMarker] = useState<GoogleMarkerInstance | null>(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);

  const updateLocation = useCallback(
    async (location: GoogleLatLngLiteral, map: GoogleMapInstance, marker: GoogleMarkerInstance) => {
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
    },
    [onLocationSelect],
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const initializeMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      const google = window.google;
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: initialMapPosition.current,
        mapTypeControl: false,
        streetViewControl: false,
      });

      const newMarker = new google.maps.Marker({
        position: selectedLocation,
        map: newMap,
        title: 'Delivery location',
        draggable: true,
      });

      newMarker.addListener('dragend', (event: GoogleMouseEvent) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        updateLocation({ lat, lng }, newMap, newMarker);
      });

      newMap.addListener('click', (event: GoogleMouseEvent) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        updateLocation({ lat, lng }, newMap, newMarker);
      });

      setMap(newMap);
      setMarker(newMarker);
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, [updateLocation, selectedLocation]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (map && marker) {
            updateLocation({ lat: latitude, lng: longitude }, map, marker);
          }
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
