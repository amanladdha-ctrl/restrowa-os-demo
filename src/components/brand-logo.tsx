/* eslint-disable @next/next/no-img-element */

export function BrandLogo({
  src,
  name,
  className = "h-16 w-16"
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        alt={`${name} logo`}
        className={`${className} shrink-0 rounded-2xl bg-white object-cover p-1`}
        decoding="async"
        loading="lazy"
        src={src}
      />
    );
  }

  return (
    <div
      className={`${className} grid shrink-0 place-items-center rounded-2xl bg-saffron text-lg font-black text-white`}
    >
      RW
    </div>
  );
}
