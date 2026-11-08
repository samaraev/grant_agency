import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { t } from '@/lib/i18n';
import { track } from '@/lib/track';
import { cn } from '@/lib/utils';

/**
 * Поиск по адресу с автодополнением из базы домов.
 * Свободный ввод тоже принимается: он ведёт на страницу результатов.
 */
export default function AddressSearch({
  buildings = [],
  size = 'lg',
  label,
  placeholder,
  autoFocus = false,
  onFreeText,
  className,
}) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return buildings.slice(0, 5);
    return buildings
      .filter((item) => {
        const haystack = `${item.address} ${item.street || ''} ${item.district || ''}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 6);
  }, [buildings, value]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goToBuilding = (building) => {
    setOpen(false);
    track(t.track.addressSearch, { query: value, matched: true, building_id: building.id });
    navigate(`/house/${building.id}`);
  };

  const submitFreeText = () => {
    const query = value.trim();
    if (!query) {
      setOpen(true);
      return;
    }
    setOpen(false);
    track(t.track.addressSearch, { query, matched: false });
    if (onFreeText) {
      onFreeText(query);
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        goToBuilding(suggestions[activeIndex]);
      } else {
        submitFreeText();
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const large = size === 'lg';

  return (
    <div ref={boxRef} className={cn('relative w-full', className)}>
      {label ? (
        <label
          htmlFor="address-search"
          className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9b28c]"
        >
          {label}
        </label>
      ) : null}

      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search
            className={cn(
              'pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[#778287]',
              large ? 'h-5 w-5' : 'h-4 w-4'
            )}
            aria-hidden="true"
          />
          <input
            id="address-search"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="address-suggestions"
            aria-autocomplete="list"
            autoComplete="off"
            autoFocus={autoFocus}
            value={value}
            placeholder={placeholder || t.home.hero.searchPlaceholder}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={cn(
              'w-full border-0 border-b bg-transparent pl-8 text-white placeholder:text-[#778287] focus:outline-none',
              large
                ? 'border-b-[#c8102e] pb-4 text-[17px] sm:text-[20px]'
                : 'border-white/25 pb-2 text-[14px]'
            )}
          />
        </div>
        <button
          type="button"
          onClick={submitFreeText}
          className={cn(
            'flex shrink-0 items-center justify-center gap-2 bg-[#c8102e] font-semibold text-white transition-colors hover:bg-[#a80d26]',
            large ? 'min-h-[52px] min-w-[52px] px-4 sm:px-7' : 'min-h-[40px] min-w-[40px] px-3'
          )}
          aria-label={t.home.hero.searchButton}
        >
          <ArrowRight className={large ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
          {large ? <span className="hidden sm:inline">{t.home.hero.searchButton}</span> : null}
        </button>
      </div>

      {open && suggestions.length > 0 ? (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[320px] overflow-auto border border-white/10 bg-[#263033] shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
        >
          {suggestions.map((building, index) => (
            <li key={building.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToBuilding(building)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  index === activeIndex ? 'bg-[#c8102e]/12' : 'hover:bg-white/5'
                )}
              >
                {building.photos?.[0] ? (
                  <span
                    className="h-11 w-14 shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${building.photos[0]})` }}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-white">
                    {building.address}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[#8f9a9f]">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {building.district}
                    {building.year_built ? ` · ${building.year_built}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}