"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import { EmptyState } from "@/components/page-header";
import { SelectField, TextField } from "@/components/form-fields";
import {
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/button-styles";
import { COMMODITIES, type CommodityId } from "@/lib/commodities";
import { useCommodityCatalog } from "@/lib/commodity-store";
import { useFarm } from "@/lib/farm-store";

type CropErrors = {
  field?: string;
  commodity?: string;
  planting?: string;
  harvest?: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewCropPage() {
  const router = useRouter();
  const { t } = useSettings();
  const { user } = useAuth();
  const farm = useFarm(user?.id);
  const { custom, add } = useCommodityCatalog();

  const [fieldId, setFieldId] = useState("");
  const [commodityId, setCommodityId] = useState("");
  const [newName, setNewName] = useState("");
  const [plantingDate, setPlantingDate] = useState(todayIso);
  const [harvestDate, setHarvestDate] = useState("");
  const [errors, setErrors] = useState<CropErrors>({});

  if (!user) return null;

  const fields = farm.data.fields;

  if (fields.length === 0) {
    return (
      <div>
        <BackLink href="/farm" label={t.farm.backToFarm} />
        <EmptyState
          icon="farm"
          title={t.farm.emptyTitle}
          description={t.farm.emptyDescription}
        >
          <Link href="/farm/fields/new" className={`${PRIMARY_BUTTON} mt-4`}>
            {t.farm.addField}
          </Link>
        </EmptyState>
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: CropErrors = {};

    if (!fields.some((field) => field.id === fieldId)) {
      nextErrors.field = t.farm.errorCropField;
    }
    let finalId = commodityId;
    if (commodityId === "__new__") {
      const created = add(newName);
      if (!created) {
        nextErrors.commodity = t.farm.errorCropCommodity;
      } else {
        finalId = created.id;
      }
    } else if (
      !COMMODITIES.some((item) => item.id === commodityId) &&
      !custom.some((item) => item.id === commodityId)
    ) {
      nextErrors.commodity = t.farm.errorCropCommodity;
    }
    if (!plantingDate) nextErrors.planting = t.farm.errorPlanting;
    if (!harvestDate || harvestDate <= plantingDate) {
      nextErrors.harvest = t.farm.errorHarvest;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const crop = farm.addCrop({
      fieldId,
      commodityId: finalId as CommodityId,
      plantingDate,
      harvestDate,
    });
    router.push(`/farm/crops/${crop.id}/costs`);
  }

  return (
    <div>
      <BackLink href="/farm" label={t.farm.backToFarm} />
      <header className="pb-5 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.farm.newCropTitle}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t.farm.newCropDescription}
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <SelectField
          id="crop-field"
          label={t.farm.cropField}
          value={fieldId}
          onChange={setFieldId}
          placeholder={t.farm.selectField}
          error={errors.field}
        >
          {fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="crop-commodity"
          label={t.farm.cropCommodity}
          value={commodityId}
          onChange={setCommodityId}
          placeholder={t.farm.selectCommodity}
          error={errors.commodity}
        >
          {COMMODITIES.map((commodity) => (
            <option key={commodity.id} value={commodity.id}>
              {t.commodities[commodity.id]}
            </option>
          ))}
          {custom.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
          <option value="__new__">{t.farm.addNewCommodity}</option>
        </SelectField>
        {commodityId === "__new__" ? (
          <TextField
            id="crop-commodity-new"
            label={t.farm.newCommodityLabel}
            value={newName}
            onChange={(value) => {
              setNewName(value);
              setErrors((current) => ({ ...current, commodity: undefined }));
            }}
            placeholder={t.farm.newCommodityPlaceholder}
          />
        ) : null}

        <TextField
          id="crop-planting"
          label={t.farm.plantingDate}
          value={plantingDate}
          onChange={(value) => {
            setPlantingDate(value);
            if (harvestDate && harvestDate <= value) setHarvestDate("");
          }}
          type="date"
          error={errors.planting}
        />

        <TextField
          id="crop-harvest"
          label={t.farm.harvestDate}
          value={harvestDate}
          onChange={setHarvestDate}
          type="date"
          error={errors.harvest}
        />

        <button type="submit" className={PRIMARY_BUTTON}>
          {t.farm.saveCrop}
        </button>

        <Link href="/farm" className={`${SECONDARY_BUTTON} text-sm`}>
          {t.common.cancel}
        </Link>
      </form>
    </div>
  );
}
