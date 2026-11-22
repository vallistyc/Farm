import farmers from "@/data/farmers.json";

export type DemoAccount = {
  id: string;
  name: string;
  phone: string;
  pin: string;
  region: string;
};

export type Farmer = Omit<DemoAccount, "pin">;

export type LoginError = "phone" | "pin" | "invalid";

export type LoginResult = { ok: true } | { ok: false; error: LoginError };

export const DEMO_ACCOUNTS: DemoAccount[] = farmers;

export function toFarmer(account: DemoAccount): Farmer {
  const { id, name, phone, region } = account;
  return { id, name, phone, region };
}

export function phoneVariants(input: string): string[] {
  const digits = input.replace(/\D/g, "");
  const variants = new Set<string>([digits]);

  if (digits.startsWith("60")) variants.add(`0${digits.slice(2)}`);
  if (digits.startsWith("62")) variants.add(`0${digits.slice(2)}`);
  if (digits.startsWith("0")) {
    variants.add(`60${digits.slice(1)}`);
    variants.add(`62${digits.slice(1)}`);
  }

  return [...variants];
}

export function findDemoAccount(
  phone: string,
  pin: string,
): DemoAccount | undefined {
  const variants = phoneVariants(phone);
  return DEMO_ACCOUNTS.find(
    (account) => variants.includes(account.phone) && account.pin === pin,
  );
}
