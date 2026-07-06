---
name: Telegram Mini App (Expo web) UI quirks
description: Why RN Alert/Linking fail inside Telegram's web-rendered mini app and what to use instead
---

# Telegram Mini App (Expo web-rendered) UI quirks

RentSVB runs as an Expo app rendered on **web inside Telegram's in-app webview**. Two React Native APIs silently fail there:

- **`Alert.alert` (react-native-web) is effectively a no-op** — the dialog often never renders and, critically, **button `onPress` callbacks never fire**. Any logic placed inside an Alert callback (e.g. `router.replace` after success) will never run. This caused a double-submit bug: success alert didn't show, navigation in its callback never happened, user stayed on the form and re-tapped → duplicate DB insert.
- **`Linking.openURL` is blocked** by Telegram's webview (`tel:`, `https://t.me/...` do nothing).

**How to apply:**
- Use the helpers in `lib/telegram.ts`: `showAlert` (tg.showPopup → tg.showAlert → window.alert), `openTelegramLink` (tg.openTelegramLink), `openPhone` (window.location.href = `tel:`). Never call `Alert.alert` or `Linking.openURL` for user-facing dialogs/links in this app.
- Never put required side effects (navigation, state) inside an Alert callback. Do the action directly after the await.
- Guard async submit handlers with a synchronous `useRef` flag (not just `useState`), because state-driven `disabled` lags behind rapid double taps.

**Why:** Confirmed via user-reported bugs (no success message, double listings, dead contact buttons) and architect review.

**Still open:** an "English notification on app open" was reported. No in-app source found. `LogBox.ignoreAllLogs()` added as a dev-warning mitigation (dev-only; no-op in prod) but the true source is unconfirmed — needs a user screenshot to target. Could be a Telegram-level message or a dev warning overlay.
