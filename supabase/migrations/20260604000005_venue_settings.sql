-- Additional venue settings exposed via /admin/settings.
-- Used by the public footer block.

insert into settings (key, value, is_public) values
  ('venue_city',         '"Біла Церква"'::jsonb, true),
  ('venue_hours',        '"10:00 — 02:00"'::jsonb, true),
  ('venue_hours_note',   '"щодня"'::jsonb, true),
  ('wifi_ssid',          '"shelter_guest"'::jsonb, true),
  ('wifi_password',      '"sh3lt3r2024"'::jsonb, true),
  ('allergy_notice_uk',  '"Алергії або щось не з меню? Просто запитайте бармена."'::jsonb, true),
  ('allergy_notice_en',  '"Allergies or something off-menu? Just ask the bartender."'::jsonb, true),
  ('copyright_year_from','2021'::jsonb, true)
on conflict (key) do nothing;
