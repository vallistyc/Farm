import Image from "next/image";

export function BrandMark({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="eager"
      className={`shrink-0 ${className}`}
    />
  );
}
