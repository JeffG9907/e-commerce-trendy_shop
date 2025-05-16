import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Configura tu token de acceso de Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoiamNhZ3VhZjQ0NzciLCJhIjoiY205dGI4aXc5MDlwOTJrcHY2cmFibGV4cyJ9.mMKsZRycJNjAJR39s1n72A';

function MapboxPicker({ longitude, latitude, zoom = 12, onLocationChange }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  // Función para obtener la dirección desde las coordenadas
  const fetchAddressFromCoordinates = async (lng, lat) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name; // Retorna la dirección
      }
    } catch (error) {
      console.error('Error al obtener la dirección:', error);
    }
    return `${lat}, ${lng}`; // Si falla, retorna las coordenadas
  };

  useEffect(() => {
    if (!mapContainer.current) {
      console.error("El contenedor del mapa no está disponible.");
      return;
    }

    if (!map.current) {
      // Inicializar el mapa
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude || -78.467834, latitude || -0.180653], // Quito como valor predeterminado
        zoom: zoom,
        maxZoom: 18,
        minZoom: 5,
      });

      // Agregar el marcador
      marker.current = new mapboxgl.Marker({
        draggable: true,
        color: '#FF0000',
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Evento para mover el marcador
      marker.current.on('dragend', async () => {
        const lngLat = marker.current.getLngLat(); // Coordenadas del marcador
        const address = await fetchAddressFromCoordinates(lngLat.lng, lngLat.lat); // Obtener la dirección
        if (onLocationChange) {
          onLocationChange({ longitude: lngLat.lng, latitude: lngLat.lat, address }); // Emitir los datos al padre
        }
      });

      // Evento para mover el marcador al hacer clic en el mapa
      map.current.on('click', async (event) => {
        const { lng, lat } = event.lngLat; // Coordenadas del clic
        marker.current.setLngLat([lng, lat]); // Mover el marcador
        const address = await fetchAddressFromCoordinates(lng, lat); // Obtener la dirección
        if (onLocationChange) {
          onLocationChange({ longitude: lng, latitude: lat, address }); // Emitir los datos al padre
        }
      });

      // Agregar controles de navegación
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Solo inicializar una vez

  useEffect(() => {
    if (map.current && marker.current) {
      // Actualizar posición del marcador y centrar el mapa
      marker.current.setLngLat([longitude, latitude]);
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: zoom,
        essential: true,
      });
    }
  }, [longitude, latitude, zoom]);

  return (
    <div 
      ref={mapContainer} 
      className="mapbox-container" 
      style={{ height: '400px', width: '100%' }} // Controla el diseño desde aquí o mediante CSS
    />
  );
}

export default MapboxPicker;