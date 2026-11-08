import { cn } from '@/lib/utils';

export default function SectionHeading({ marker, title, subtitle, align = 'left', className }) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {marker ? <div className="eyebrow mb-5">{marker}</div> : null}
      <h2 className="text-[28px] leading-[1.12] font-bold text-white sm:text-[38px] lg:text-[46px]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-5 text-[15px] leading-relaxed text-[#b0b8bc] sm:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}