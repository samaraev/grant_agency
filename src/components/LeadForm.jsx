import { useMemo, useState } from 'react';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBuildingList } from '@/hooks/useBuildings';
import { getUtm, track } from '@/lib/track';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const TYPES = ['owner_appraise', 'owner_sell', 'buyer_buy', 'buyer_check', 'general'];
const CONTACTS = ['phone', 'telegram', 'whatsapp'];

export function formatPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7')) digits = `7${digits}`;
  digits = digits.slice(0, 11);
  const rest = digits.slice(1);
  let out = '+7';
  if (rest.length) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += ')';
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

export default function LeadForm({
  defaultType = 'owner_appraise',
  defaultAddress = '',
  buildingId = null,
  onSuccess,
}) {
  const { buildings } = useBuildingList({ limit: 200 });
  const [type, setType] = useState(TYPES.includes(defaultType) ? defaultType : 'general');
  const [address, setAddress] = useState(defaultAddress);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchedBuilding, setMatchedBuilding] = useState(buildingId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferred, setPreferred] = useState('phone');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const suggestions = useMemo(() => {
    const query = address.trim().toLowerCase();
    if (query.length < 2) return [];
    return buildings
      .filter((item) => `${item.address} ${item.street || ''}`.toLowerCase().includes(query))
      .slice(0, 5);
  }, [address, buildings]);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = t.lead.errors.name;
    if (phone.replace(/\D/g, '').length !== 11) nextErrors.phone = t.lead.errors.phone;
    if (!consent) nextErrors.consent = t.lead.errors.consent;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSending(true);
    try {
      const utm = getUtm();
      const response = await base44.functions.invoke('submitLead', {
        type,
        building_id: matchedBuilding || null,
        address_text: address.trim(),
        name: name.trim(),
        phone,
        preferred_contact: preferred,
        message: message.trim(),
        consent: true,
        honeypot,
        utm,
        referrer: document.referrer || '',
        page_path: window.location.pathname + window.location.search,
      });

      if (response?.data?.ok) {
        track(t.track.leadSubmit, { type, building_id: matchedBuilding || null });
        setDone(true);
        onSuccess?.();
      } else if (response?.status === 429) {
        setErrors({ form: t.lead.errors.rate });
      } else {
        setErrors({ form: t.lead.errors.generic });
      }
    } catch (error) {
      setErrors({ form: error?.response?.status === 429 ? t.lead.errors.rate : t.lead.errors.generic });
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="text-left">
        <div className="flex h-12 w-12 items-center justify-center border border-[#c8102e] bg-[#c8102e]/15">
          <Check className="h-5 w-5 text-[#c9b28c]" aria-hidden="true" />
        </div>
        <h3 className="mt-5 text-[22px] font-bold text-white">{t.lead.success.title}</h3>
        <p className="mt-3 text-[14px] leading-relaxed text-[#b0b8bc]">{t.lead.success.text}</p>
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="eyebrow mb-3">{t.lead.success.nextTitle}</div>
          <ol className="space-y-2.5">
            {t.lead.success.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-[13.5px] text-[#d7dcde]">
                <span className="font-mono text-[#c8102e]">0{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <fieldset>
        <legend className="eyebrow mb-3">{t.lead.typeLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                'min-h-[38px] border px-3 text-[12.5px] transition-colors',
                type === value
                  ? 'border-[#c8102e] bg-[#c8102e] text-white'
                  : 'border-white/15 text-[#b0b8bc] hover:border-white/35 hover:text-white'
              )}
            >
              {t.lead.types[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="relative mt-6">
        <label htmlFor="lead-address" className="eyebrow mb-2 block">
          {t.lead.addressLabel}
        </label>
        <input
          id="lead-address"
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            setMatchedBuilding(null);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={t.lead.addressPlaceholder}
          className="w-full border-b border-white/20 bg-transparent pb-2.5 text-[15px] text-white placeholder:text-[#778287] focus:border-[#c8102e] focus:outline-none"
        />
        <p className="mt-1.5 text-[11px] text-[#778287]">{t.lead.addressHint}</p>
        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto border border-white/10 bg-[#1f272b] shadow-xl">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setAddress(item.address);
                    setMatchedBuilding(item.id);
                    setShowSuggestions(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] text-[#d7dcde] hover:bg-white/5"
                >
                  <span>{item.address}</span>
                  <span className="text-[11px] text-[#778287]">{item.district}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="eyebrow mb-2 block">
            {t.lead.nameLabel}
          </label>
          <input
            id="lead-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.lead.namePlaceholder}
            className="w-full border-b border-white/20 bg-transparent pb-2.5 text-[15px] text-white placeholder:text-[#778287] focus:border-[#c8102e] focus:outline-none"
          />
          {errors.name ? <p className="mt-1.5 text-[11.5px] text-[#c9b28c]">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor="lead-phone" className="eyebrow mb-2 block">
            {t.lead.phoneLabel}
          </label>
          <input
            id="lead-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
            onFocus={() => !phone && setPhone('+7 (')}
            placeholder={t.lead.phonePlaceholder}
            className="w-full border-b border-white/20 bg-transparent pb-2.5 text-[15px] text-white placeholder:text-[#778287] focus:border-[#c8102e] focus:outline-none"
          />
          {errors.phone ? <p className="mt-1.5 text-[11.5px] text-[#c9b28c]">{errors.phone}</p> : null}
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="eyebrow mb-3">{t.lead.contactLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {CONTACTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPreferred(value)}
              className={cn(
                'min-h-[38px] border px-3 text-[12.5px] transition-colors',
                preferred === value
                  ? 'border-[#c9b28c] text-[#c9b28c]'
                  : 'border-white/15 text-[#8f9a9f] hover:border-white/35 hover:text-white'
              )}
            >
              {t.lead.contacts[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="lead-message" className="eyebrow mb-2 block">
          {t.lead.messageLabel}{' '}
          <span className="normal-case tracking-normal text-[#778287]">({t.common.optional})</span>
        </label>
        <textarea
          id="lead-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder={t.lead.messagePlaceholder}
          className="w-full resize-none border border-white/15 bg-[#1f272b] p-3 text-[14px] text-white placeholder:text-[#6f7a7f] focus:border-[#c8102e] focus:outline-none"
        />
      </div>

      {/* Ловушка для ботов */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="lead-company">Компания</label>
        <input
          id="lead-company"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-[12.5px] leading-relaxed text-[#b0b8bc]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8102e]"
        />
        <span>
          {t.lead.consentLabel}.{' '}
          <a
            href="/politika-konfidencialnosti"
            className="link-underline"
            onClick={(event) => event.stopPropagation()}
          >
            {t.lead.consentLink}
          </a>
        </span>
      </label>
      {errors.consent ? <p className="mt-1.5 text-[11.5px] text-[#c9b28c]">{errors.consent}</p> : null}

      {errors.form ? (
        <p className="mt-4 border border-[#c8102e]/50 bg-[#c8102e]/10 px-3 py-2 text-[12.5px] text-[#c9b28c]">
          {errors.form}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 bg-[#eee7dc] px-5 text-[14px] font-semibold text-[#1a2025] transition-colors hover:bg-white disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {sending ? t.lead.submitting : t.lead.submit}
        {!sending ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
      </button>

      <p className="mt-4 text-[11.5px] leading-relaxed text-[#6f7a7f]">{t.lead.disclaimer}</p>
    </form>
  );
}