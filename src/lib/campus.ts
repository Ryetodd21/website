/**
 * Static campus / map constants shared across the dashboard.
 *
 * These are FALLBACK values used when the server hasn't been queried yet or
 * returns no campus row. The live values come from `GET /api/config/campus`
 * (see `useInstitution()` in `@/lib/institution`); this file only holds the
 * UI defaults so a cold-loaded map picker has something to render.
 *
 * Previously the same literal `{ lat: 0.5391, lng: 123.0587 }` was duplicated
 * in `app/(dashboard)/settings/page.tsx` and `components/maps/here-map.tsx`
 * — easy to drift apart on a future map move. Single source of truth here.
 */

/** UNG Kampus Utama — Kota Gorontalo (Jl. Sudirman No. 6, Wumialo, Kota Tengah).
 *  Beberapa fakultas punya lokasi tambahan di luar kampus utama, tapi
 *  kampus pusat UNG ada di Kota Gorontalo (bukan Limboto/Kabupaten Gorontalo).
 *  Koordinat ini adalah fallback sebelum server mengembalikan data kampus
 *  via `GET /api/config/campus`. */
export const DEFAULT_CAMPUS_CENTER = { lat: 0.5391, lng: 123.0587 };
