import { TileLayer } from 'react-leaflet';

// Esri "Dark Gray Canvas": a keyless basemap that allows embedding, unlike the
// OSM tile servers (403 for third-party sites) and CARTO (now needs an API key).
const BASE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}';
const ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MAX_ZOOM = 16;

export default function MapTiles() {
  return (
    <>
      <TileLayer url={BASE_URL} attribution={ATTRIBUTION} maxZoom={MAX_ZOOM} />
      {/* Street and district labels drawn over the dark canvas */}
      <TileLayer url={LABELS_URL} maxZoom={MAX_ZOOM} />
    </>
  );
}