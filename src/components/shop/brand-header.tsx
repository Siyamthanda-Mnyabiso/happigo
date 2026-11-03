import Image from 'next/image';

/** The orange rounded header with the HappiGo logo, from the sign in design. */
export function BrandHeader() {
  return (
    <header className="relative h-[236px] overflow-hidden rounded-b-[40px] bg-brand">
      <span
        aria-hidden
        className="absolute -top-[90px] left-[230px] size-60 rounded-full bg-white/10"
      />
      <Image
        src="/brand/happigo-logo.svg"
        alt="HappiGo"
        width={292}
        height={195}
        priority
        className="absolute left-1/2 top-[22px] h-auto w-[292px] -translate-x-1/2"
      />
    </header>
  );
}
