import type { ReactNode } from "react";
import {
  GlyphIcon,
  type ActionIconName,
  type NavIconName,
} from "@/components/icons";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="pb-5 pt-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  note,
  children,
}: {
  icon: NavIconName | ActionIconName;
  title: string;
  description: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <GlyphIcon name={icon} className="size-6" />
      </span>
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
      {note ? (
        <p className="mt-3 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-muted">
          {note}
        </p>
      ) : null}
      {children}
    </div>
  );
}
