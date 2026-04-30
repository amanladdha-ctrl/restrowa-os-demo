/* eslint-disable @next/next/no-img-element */

export function FoodImage({
  src,
  alt,
  className = "h-20 w-20"
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        alt={alt}
        className={`${className} shrink-0 rounded-2xl object-cover`}
        decoding="async"
        loading="lazy"
        src={src}
      />
    );
  }

  return (
    <div
      className={`${className} grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-50 via-white to-emerald-50 text-xs font-black text-clay`}
    >
      IMG
    </div>
  );
}
