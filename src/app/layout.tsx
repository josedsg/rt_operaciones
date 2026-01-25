import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Riotapezco-Operaciones",
    default: "Riotapezco-Operaciones",
  },
  description: "Sistema de Operaciones Rio Tapezco",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <Toaster position="top-right" />

          <NextTopLoader color="#5750F1" showSpinner={false} />
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
