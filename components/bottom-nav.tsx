"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/components/providers";
import { GlyphIcon, type NavIconName } from "@/components/icons";

const ITEMS: {
  href: string;
  labelKey: "home" | "farm" | "priceRadar" | "community" | "profile";
  icon: NavIconName;
}[] = [
  { href: "/home", labelKey: "home", icon: "home" },
  { href: "/farm", labelKey: "farm", icon: "farm" },
  { href: "/price-radar", labelKey: "priceRadar", icon: "chart" },
  { href: "/community", labelKey: "community", icon: "chat" },
  { href: "/profile", labelKey: "profile", icon: "user" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useSettings();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <nav aria-label={t.nav.mainLabel} className="flex">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors ${
                active ? "text-brand" : "text-ink-muted hover:text-ink"
              }`}
            >
              <span
                className={`flex size-9 items-center justify-center rounded-full ${
                  active ? "bg-brand-soft" : ""
                }`}
              >
                <GlyphIcon name={item.icon} className="size-5" />
              </span>
              <span className="max-w-full truncate">{t.nav[item.labelKey]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
