import { TileLayer } from 'react-leaflet';

// CARTO dark basemap: allows embedding with attribution, unlike the OSM tile
// servers that answer third-party embeds with "403 Access blocked".
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function MapTiles() {
  return (
    <TileLayer
      url={TILE_URL}
      attribution={ATTRIBUTION}
      subdomains="abcd"
      maxZoom={20}
      detectRetina
    />
  );
}