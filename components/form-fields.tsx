"use client";

import type { ReactNode } from "react";

const inputBase =
  "min-h-12 w-full rounded-xl border bg-surface px-4 text-base outline-none transition-colors placeholder:text-ink-muted/60 focus:ring-2 focus:ring-brand/25";

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  suffix?: string;
  type?: "text" | "date" | "tel" | "password";
  inputMode?: "text" | "numeric" | "decimal" | "tel";
  autoComplete?: string;
  maxLength?: number;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  suffix,
  type = "text",
  inputMode = "text",
  autoComplete,
  maxLength,
}: TextFieldProps) {
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          inputMode={type === "date" ? undefined : inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onClick={(event) => {
            // For an empty date field, tapping anywhere in the box opens the
            // calendar (not just the tiny icon). Once a value exists, clicking
            // focuses a segment so the user can still type directly.
            if (type === "date" && !value) {
              try {
                event.currentTarget.showPicker?.();
              } catch {
                /* showPicker needs a user gesture / may be unsupported */
              }
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${
            error ? "border-rugi" : "border-line focus:border-brand"
          } ${suffix ? "pr-20" : ""}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-ink-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-rugi">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  children: ReactNode;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  children,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputBase} ${
          error ? "border-rugi" : "border-line focus:border-brand"
        }`}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-rugi">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-rugi/30 bg-rugi/10 px-4 py-3 text-sm text-rugi"
    >
      {message}
    </p>
  );
}
