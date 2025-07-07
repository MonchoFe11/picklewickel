import Image from 'next/image';

interface LogoProps {
  className?: string;
  /** Optional square size in px – defaults to 120 × 120 */
  size?: number;
}

export default function Logo({ className = '', size = 120 }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="PickleWickel logo"
      width={size}
      height={size}
      priority
      className={`w-44 md:w-48 lg:w-56 mx-auto ${className}`}  // 160px → 192px → 224px
    />
  );
}