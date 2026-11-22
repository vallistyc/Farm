"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { TextField } from "@/components/form-fields";
import { PRIMARY_BUTTON } from "@/components/button-styles";
import { useFarm } from "@/lib/farm-store";
import { parseDecimal } from "@/lib/format";

type FieldErrors = {
  name?: string;
  size?: string;
  location?: string;
};

export default function NewFieldPage() {
  const router = useRouter();
  const { t } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);

  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!user) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const sizeValue = parseDecimal(size);

    if (!name.trim()) nextErrors.name = t.farm.errorFieldName;
    if (sizeValue <= 0) nextErrors.size = t.farm.errorFieldSize;
    if (!location.trim()) nextErrors.location = t.farm.errorFieldLocation;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    farm.addField({
      name: name.trim(),
      sizeHa: sizeValue,
      location: location.trim(),
    });
    router.push("/farm");
  }

  return (
    <div>
      <BackLink href="/farm" label={t.farm.backToFarm} />
      <header className="pb-5 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.farm.newFieldTitle}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t.farm.newFieldDescription}
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          id="field-name"
          label={t.farm.fieldName}
          value={name}
          onChange={setName}
          placeholder={t.farm.fieldNamePlaceholder}
          error={errors.name}
          autoComplete="off"
        />
        <TextField
          id="field-size"
          label={t.farm.fieldSize}
          value={size}
          onChange={setSize}
          inputMode="decimal"
          suffix={t.units.hectare}
          error={errors.size}
        />
        <TextField
          id="field-location"
          label={t.farm.fieldLocation}
          value={location}
          onChange={setLocation}
          placeholder={t.farm.fieldLocationPlaceholder}
          error={errors.location}
          autoComplete="off"
        />

        <button type="submit" className={PRIMARY_BUTTON}>
          {t.farm.saveField}
        </button>
      </form>
    </div>
  );
}
