import logo from "@/assets/logos/rio-tapezco-logo.png";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-12 w-auto">
      <Image
        src={logo}
        alt="Rio Tapezco Logo"
        className="h-full w-auto object-contain"
        priority
      />
    </div>
  );
}
