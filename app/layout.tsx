import type { Metadata, Viewport } from "next";
import "./globals.css";

// The shell is gated client-side (localStorage settings/session), so there is
// no static page shell to validate for instant navigation.
export const instant = false;
import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { MarketPricesProvider } from "@/components/market-prices";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";

export const metadata: Metadata = {
  applicationName: "Harga Jual Petani",
  title: {
    default: "Harga Jual Petani",
    template: "%s · Harga Jual Petani",
  },
  description:
    "Mobile-first PWA that helps farmers set a fair selling price from real costs and market prices.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Harga Tani",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#166534" },
    { media: "(prefers-color-scheme: dark)", color: "#0b140c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-background text-ink">
        <AppProviders>
          <MarketPricesProvider>
            <ServiceWorkerRegistrar />
            <AppShell>{children}</AppShell>
          </MarketPricesProvider>
        </AppProviders>
      </body>
    </html>
  );
}
