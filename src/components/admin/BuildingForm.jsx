import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Upload, X, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';

const FIELD =
  'h-[38px] w-full border border-white/10 bg-[#1f272b] px-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none';

const EMPTY = {
  address: '',
  property_type: 'residential',
  deal_type: 'sale',
  price: '',
  area: '',
  city: 'Москва',
  district: '',
  street: '',
  house_number: '',
  year_built: '',
  series_or_type: '',
  floors: '',
  entrances: '',
  apartments_count: '',
  description: '',
  features: [],
  photos: [],
  videos: [],
  latitude: '',
  longitude: '',
  is_published: true,
};

function ClickPicker({ value, onPick }) {
  useMapEvents({
    click(event) {
      onPick(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
    },
  });
  if (!value || !value[0]) return null;
  return (
    <CircleMarker
      center={value}
      radius={9}
      pathOptions={{ color: '#c8102e', fillColor: '#c8102e', fillOpacity: 0.95, weight: 2 }}
    />
  );
}

export default function BuildingForm({ building, open, onOpenChange, onSaved, onDeleted }) {
  const [draft, setDraft] = useState({ ...EMPTY });
  const [featuresText, setFeaturesText] = useState('');
  const [videosText, setVideosText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!building) return;
    setDraft({ ...EMPTY, ...building });
    setFeaturesText((building.features || []).join('\n'));
    setVideosText((building.videos || []).join('\n'));
    setError('');
  }, [building]);

  const coords =
    draft.latitude && draft.longitude ? [Number(draft.latitude), Number(draft.longitude)] : null;

  const uploadPhotos = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        uploaded.push(file_url);
      }
      setDraft((current) => ({ ...current, photos: [...(current.photos || []), ...uploaded] }));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft.address.trim()) {
      setError(t.admin.buildings.form.addressRequired);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        address: draft.address.trim(),
        property_type: draft.property_type || 'residential',
        deal_type: draft.deal_type || 'sale',
        price: draft.price ? Number(draft.price) : null,
        area: draft.area ? Number(draft.area) : null,
        city: draft.city,
        district: draft.district,
        street: draft.street,
        house_number: draft.house_number,
        year_built: draft.year_built ? Number(draft.year_built) : null,
        series_or_type: draft.series_or_type,
        floors: draft.floors ? Number(draft.floors) : null,
        entrances: draft.entrances ? Number(draft.entrances) : null,
        apartments_count: draft.apartments_count ? Number(draft.apartments_count) : null,
        description: draft.description,
        features: featuresText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        photos: draft.photos || [],
        videos: videosText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        latitude: draft.latitude ? Number(draft.latitude) : null,
        longitude: draft.longitude ? Number(draft.longitude) : null,
        is_published: Boolean(draft.is_published),
        updated_at: new Date().toISOString().slice(0, 10),
      };

      const saved = draft.id
        ? await base44.entities.Building.update(draft.id, payload)
        : await base44.entities.Building.create(payload);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err?.response?.data?.message || t.admin.common.error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft.id) return;
    if (!window.confirm(t.admin.buildings.form.deleteConfirm)) return;
    await base44.entities.Building.delete(draft.id);
    onDeleted?.(draft.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-[760px] overflow-y-auto border-white/10 bg-[#263033]">
        <DialogTitle className="text-[18px] font-bold text-white">
          {draft.id ? t.admin.buildings.form.editTitle : t.admin.buildings.form.createTitle}
        </DialogTitle>

        <div className="space-y-4">
          <div>
            <label htmlFor="b-address" className="eyebrow mb-2 block">
              {t.admin.buildings.form.address}
            </label>
            <input
              id="b-address"
              value={draft.address}
              onChange={(event) => setDraft({ ...draft, address: event.target.value })}
              className={FIELD}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="b-property-type" className="eyebrow mb-2 block">
                {t.common.type}
              </label>
              <select
                id="b-property-type"
                value={draft.property_type || 'residential'}
                onChange={(event) => setDraft({ ...draft, property_type: event.target.value })}
                className={FIELD}
              >
                {Object.entries(t.propertyTypes).map(([value, label]) => (
                  <option key={value} value={value} className="bg-[#1f272b]">
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="b-deal-type" className="eyebrow mb-2 block">
                {t.common.deal}
              </label>
              <select
                id="b-deal-type"
                value={draft.deal_type || 'sale'}
                onChange={(event) => setDraft({ ...draft, deal_type: event.target.value })}
                className={FIELD}
              >
                {Object.entries(t.deals).map(([value, label]) => (
                  <option key={value} value={value} className="bg-[#1f272b]">
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="b-price" className="eyebrow mb-2 block">
                {t.common.price}
              </label>
              <input
                id="b-price"
                type="number"
                value={draft.price ?? ''}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="b-area" className="eyebrow mb-2 block">
                {t.common.area}
              </label>
              <input
                id="b-area"
                type="number"
                value={draft.area ?? ''}
                onChange={(event) => setDraft({ ...draft, area: event.target.value })}
                className={FIELD}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="b-city" className="eyebrow mb-2 block">
                {t.admin.buildings.form.city}
              </label>
              <input
                id="b-city"
                value={draft.city}
                onChange={(event) => setDraft({ ...draft, city: event.target.value })}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="b-district" className="eyebrow mb-2 block">
                {t.admin.buildings.form.district}
              </label>
              <input
                id="b-district"
                value={draft.district}
                onChange={(event) => setDraft({ ...draft, district: event.target.value })}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="b-street" className="eyebrow mb-2 block">
                {t.admin.buildings.form.street}
              </label>
              <input
                id="b-street"
                value={draft.street}
                onChange={(event) => setDraft({ ...draft, street: event.target.value })}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="b-house" className="eyebrow mb-2 block">
                {t.admin.buildings.form.houseNumber}
              </label>
              <input
                id="b-house"
                value={draft.house_number}
                onChange={(event) => setDraft({ ...draft, house_number: event.target.value })}
                className={FIELD}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { key: 'year_built', label: 'year', type: 'number' },
              { key: 'floors', label: 'floors', type: 'number' },
              { key: 'entrances', label: 'entrances', type: 'number' },
              { key: 'apartments_count', label: 'apartments', type: 'number' },
              { key: 'series_or_type', label: 'series', type: 'text' },
            ].map((field) => (
              <div key={field.key}>
                <label htmlFor={`b-${field.key}`} className="eyebrow mb-2 block">
                  {t.admin.buildings.form[field.label]}
                </label>
                <input
                  id={`b-${field.key}`}
                  type={field.type}
                  value={draft[field.key] ?? ''}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  className={FIELD}
                />
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="b-description" className="eyebrow mb-2 block">
              {t.admin.buildings.form.description}
            </label>
            <textarea
              id="b-description"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              rows={4}
              className="w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="b-features" className="eyebrow mb-2 block">
              {t.admin.buildings.form.features}
            </label>
            <textarea
              id="b-features"
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
              rows={4}
              className="w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
            />
          </div>

          <div>
            <div className="eyebrow mb-2">{t.admin.buildings.form.photos}</div>
            <div className="flex flex-wrap gap-2">
              {(draft.photos || []).map((photo) => (
                <div key={photo} className="relative h-20 w-24 overflow-hidden border border-white/10">
                  <Image src={photo} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, photos: draft.photos.filter((item) => item !== photo) })
                    }
                    aria-label={t.admin.common.delete}
                    className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[#1a2025]/85 text-white"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <label className="flex h-20 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-white/20 text-[10.5px] text-[#8f9a9f]">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {uploading ? t.admin.buildings.form.uploading : t.admin.buildings.form.upload}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => uploadPhotos(event.target.files)}
                />
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="b-videos" className="eyebrow mb-2 block">
              {t.admin.buildings.form.videos}
            </label>
            <textarea
              id="b-videos"
              value={videosText}
              onChange={(event) => setVideosText(event.target.value)}
              rows={2}
              className="w-full resize-none border border-white/10 bg-[#1f272b] p-3 text-[13px] text-white focus:border-[#c8102e] focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="b-lat" className="eyebrow mb-2 block">
                {t.admin.buildings.form.latitude}
              </label>
              <input
                id="b-lat"
                value={draft.latitude ?? ''}
                onChange={(event) => setDraft({ ...draft, latitude: event.target.value })}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="b-lng" className="eyebrow mb-2 block">
                {t.admin.buildings.form.longitude}
              </label>
              <input
                id="b-lng"
                value={draft.longitude ?? ''}
                onChange={(event) => setDraft({ ...draft, longitude: event.target.value })}
                className={FIELD}
              />
            </div>
            <div className="flex items-end pb-1 text-[11.5px] text-[#778287]">
              {t.admin.buildings.form.pickOnMap}
            </div>
          </div>

          <div className="h-[240px] overflow-hidden border border-white/10">
            <MapContainer
              center={coords || [54.1938, 37.6178]}
              zoom={coords ? 16 : 13}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <ClickPicker
                value={coords}
                onPick={(lat, lng) => setDraft({ ...draft, latitude: lat, longitude: lng })}
              />
            </MapContainer>
          </div>

          <label className="flex items-center gap-3 text-[13px] text-[#d7dcde]">
            <input
              type="checkbox"
              checked={Boolean(draft.is_published)}
              onChange={(event) => setDraft({ ...draft, is_published: event.target.checked })}
              className="h-4 w-4 accent-[#c8102e]"
            />
            {t.admin.buildings.form.published}
          </label>

          {error ? <p className="text-[12px] text-[#c9b28c]">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="min-h-[42px] bg-[#c8102e] px-5 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? t.admin.common.loading : t.admin.buildings.form.save}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-[42px] border border-white/15 px-4 text-[13px] text-[#d7dcde]"
            >
              {t.admin.buildings.form.cancel}
            </button>
            {draft.id ? (
              <button
                type="button"
                onClick={remove}
                className="ml-auto flex min-h-[42px] items-center gap-2 border border-white/10 px-4 text-[12.5px] text-[#8f9a9f] hover:border-[#c8102e] hover:text-[#c9b28c]"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t.admin.buildings.form.delete}
              </button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}