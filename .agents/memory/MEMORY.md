# Memory Index

- [Telegram Mini App UI quirks](telegram-webview-ui-quirks.md) — RN-web `Alert.alert` is a no-op (callbacks never fire) and `Linking.openURL` is blocked in Telegram webview; use `lib/telegram.ts` helpers + ref-guard submits.
- [RentSVB Supabase schema sync](supabase-project-mismatch.md) — key valid + schema migrated (resolved). App uses 5 tables (profiles/properties/owner_requests/rentals/settings); keep supabase_setup.sql in sync with every .from() call; apply DDL via SQL Editor, not connection string.
