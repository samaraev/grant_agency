const MAPTILER_URL =
  'https://api.maptiler.com/maps/01a1fd46-0e95-7d7d-b71a-ba24a499de1e/?key=RySikGfaCfzBXxxH6EeN#13.6/55.72856/37.57656';

export default function MapTilerEmbed({ title, className = '' }) {
  return (
    <iframe
      width="500"
      height="300"
      allow="geolocation"
      src={MAPTILER_URL}
      title={title}
      loading="lazy"
      className={`block h-full w-full border-0 ${className}`.trim()}
    />
  );
}
