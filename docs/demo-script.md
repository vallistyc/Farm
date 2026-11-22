# 2-minute demo script

Target device: phone-sized browser or desktop DevTools at 360 x 800.
Demo account: **Ahmad bin Ali · 0123456789 · PIN 1234** (tap the account card on the login screen).

Before the demo:

- Use a private window or clear site data so the farm starts with only the seeded field.
- Set at least one of `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY` on the server if you want a live AI answer. Without any, the app shows a clear setup message instead of failing.
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` after running `supabase/schema.sql` if you want cloud sync. Without them the app stays local-only and Profile says "Hanya di HP ini".
- Market prices come from the official daily PriceCatcher feed for spinach, chilli, and banana; padi and maize show the sample series and are labeled "Data contoh".

## Flow (about 2 minutes)

| Time | Screen | What to tap / say |
| --- | --- | --- |
| 0:00 | Login | Tap the Ahmad demo account, then Log in. |
| 0:10 | Home | Show the summary (empty at first) and the three quick actions. Point out the floating **Ask AI** button. |
| 0:20 | Farm | Tap **Add crop**. Keep field **Sawah Utama**, choose **Rice / Padi**, keep the default dates, tap **Save and enter costs**. |
| 0:35 | Costs, step 1 | **Add cost**: "Seeds" 300. Tap Next. |
| 0:42 | Costs, step 2 | **Add cost**: "Harvest labour" 120. Tap Next. |
| 0:48 | Costs, step 3 | Tick **Transport** 40 and **Middleman commission** 30. Tap Next. |
| 0:55 | Costs, step 4 | Expected harvest **120 kg**, loss **10%**. Save costs. |
| 1:00 | Crop detail | Show total cost, cost per kg, and the suggested price. Tap **See price recommendation**. |
| 1:05 | Recommendation | Status is **Loss (Rugi)** in red: the minimum price is about MYR 4.99 while the sample market is MYR 2.64. Read the three short tips. |
| 1:15 | AI advice | Tap **Ask AI for advice**. Show the crop context card, tap "Should I sell now?", and let the advisor answer in the selected language. |
| 1:35 | Price Radar | Open **Rice / Padi**: the 30-day trend and the dashed **your minimum** line sit above the market price. Point out the **Sample data** badge on padi/maize, then open **Chilli** to show **Official data** from PriceCatcher with its observation date. |
| 1:45 | Profile | Point at the data status ("Tersimpan di internet" when Supabase is set up). Switch language to **Basa Jawa** (or English). Show the localized Home and mention the AI replies in that language. Switch currency to IDR to show display-only conversion. |
| 1:55 | Home | Close on the quick actions and floating AI button. |

## Optional variations

- **Safe result:** redo the costs with direct 50, labour 30, transport 10. The status turns green (Aman) and the recommended price follows the market.
- **Margin:** in the calculator, change margin from 10% to 20% and show the minimum price update immediately.
- **Language:** repeat one screen in Bahasa Melayu and Basa Jawa to show the four-language dictionary.
- **PWA:** install the app from the browser menu; the shell opens from the cache, and farm data is read from the device with a cloud copy when Supabase is configured.

## If something goes wrong

- **AI setup message:** the server has no AI provider key. Skip the AI step or set `OPENROUTER_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY` and restart.
- **Wrong language:** Profile → Language. The choice is saved on the device.
- **Messy data:** use a new private window, or DevTools → Application → Clear site data. All app data is stored under `hjp.*` localStorage keys. With Supabase configured, logging in pulls the cloud copy back.
- **Cloud status stays on "Gagal":** check the two `NEXT_PUBLIC_SUPABASE_*` variables, that the schema was run, and that the anon key belongs to the same project. Local data is still safe.
