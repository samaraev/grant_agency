import { cn } from '@/lib/utils';

export default function SectionHeading({ marker, title, subtitle, align = 'left', className, level = 2 }) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {marker ? <div className="eyebrow mb-5">{marker}</div> : null}
      <Heading className="text-[32px] leading-[1.1] text-white sm:text-[44px] lg:text-[54px]">
        {title}
      </Heading>
      {subtitle ? (
        <p className="mt-5 text-[15px] leading-relaxed text-[#b0b8bc] sm:text-base">{subtitle}</p>
      ) : null}
    </div>
  );
}