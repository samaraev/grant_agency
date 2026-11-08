import { Phone, Send, MessageCircle, Clock } from 'lucide-react';
import LeadForm from '@/components/LeadForm';
import { t } from '@/lib/i18n';

export default function ClusterContact({ settings }) {
  const phone = settings?.phone || t.settings.phone;
  const telegram = settings?.telegram || t.settings.telegram;
  const whatsapp = settings?.whatsapp || t.settings.whatsapp;

  return (
    <section className="border-t border-white/10 bg-[#1f272b]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8 lg:py-20">
        <div>
          <div className="eyebrow">{t.cluster.contact.marker}</div>
          <h2 className="mt-4 text-[26px] font-bold leading-tight text-white sm:text-[34px]">
            {t.cluster.contact.title}
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-[#b0b8bc]">{t.cluster.contact.text}</p>

          <div className="mt-8 border border-white/10 bg-[#263033] p-5">
            <div className="text-[17px] font-semibold text-white">{t.cluster.contact.name}</div>
            <div className="mt-1 text-[12.5px] text-[#8f9a9f]">{t.cluster.contact.role}</div>
            <div className="mt-4 flex items-center gap-2 text-[13px] text-[#c9b28c]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t.cluster.contact.hours}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`tel:${String(phone).replace(/[^\d+]/g, '')}`}
                className="flex min-h-[38px] items-center gap-2 border border-white/15 px-3 text-[12.5px] text-white hover:border-[#c9b28c]"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {t.lead.contacts.phone}
              </a>
              <a
                href={telegram}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[38px] items-center gap-2 border border-white/15 px-3 text-[12.5px] text-white hover:border-[#c9b28c]"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {t.lead.contacts.telegram}
              </a>
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[38px] items-center gap-2 border border-white/15 px-3 text-[12.5px] text-white hover:border-[#c9b28c]"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {t.lead.contacts.whatsapp}
              </a>
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-[#6f7a7f]">{t.cluster.contact.note}</p>
          </div>
        </div>

        <div className="border border-white/10 bg-[#263033] p-5 sm:p-7">
          <h3 className="text-[22px] font-bold text-white">{t.cluster.formTitle}</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#b0b8bc]">{t.cluster.formText}</p>
          <div className="mt-6">
            <LeadForm defaultType="owner_sell" cluster="khamovniki" />
          </div>
        </div>
      </div>
    </section>
  );
}