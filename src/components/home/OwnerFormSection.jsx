import LeadForm from '@/components/LeadForm';
import { t } from '@/lib/i18n';

export default function OwnerFormSection() {
  const f = t.homepage.help.form;

  return (
    <section id="owner-form" className="border-b border-white/10 bg-[#1f272b]">
      <div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
          <div>
            <div className="eyebrow">{f.marker}</div>
            <h2 className="mt-5 font-heading text-[28px] leading-[1.12] text-white sm:text-[38px]">
              {f.title}
            </h2>
            <p className="mt-5 max-w-lg text-[14px] leading-relaxed text-[#b0b8bc]">{f.text}</p>
            <p className="mt-6 border-l-2 border-[#c8102e] pl-4 text-[12.5px] leading-relaxed text-[#8f9a9f]">
              {f.note}
            </p>
          </div>
          <div className="border border-white/10 bg-[#263033] p-5 sm:p-7">
            <LeadForm defaultType="owner_appraise" cluster="khamovniki" />
          </div>
        </div>
      </div>
    </section>
  );
}