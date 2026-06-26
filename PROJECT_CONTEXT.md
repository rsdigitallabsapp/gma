# GMA — Project Context

**Good Morning Affirmations** — a React Native app that intercepts the user's first morning moment and delivers one personalized affirmation before they reach social media or email. The entire ritual takes under 10 seconds.

---

## Stack & Versions

| Layer | Choice |
|---|---|
| Framework | React Native 0.85.3 + Expo SDK 56 (bare workflow, prebuild) |
| React | 19.2.3 |
| Navigation | React Navigation v7 — `@react-navigation/native-stack` |
| Storage | `react-native-mmkv` v4 (synchronous, no async/await) |
| Animations | `react-native-reanimated` v4 + React Native `Animated` API |
| Speech | `expo-speech-recognition` |
| Notifications | `expo-notifications` |
| Haptics | `expo-haptics` |
| SVG | `react-native-svg` |
| Fonts | `@expo-google-fonts/playfair-display` |
| Safe Area | `react-native-safe-area-context` |
| Date utils | `date-fns` v4 — **installed but currently unused** |
| New Architecture | Enabled (`RCTNewArchEnabled: true` in Info.plist) |

---

## Design System (`src/theme/index.js`)

**Color palette — deep navy with warm gold accent:**

| Token | Hex | Role |
|---|---|---|
| `bg` | `#0A0D17` | App background (dark navy) |
| `surface` | `#131728` | Cards, rows |
| `surfaceElevated` | `#1A2035` | Selected state surfaces |
| `gold` | `#C8A96E` | Primary accent, CTA buttons, streak |
| `goldLight` | `#E8C96A` | Hover / highlight gold |
| `goldDim` | `#8A6F3E` | Active ring, disabled buttons |
| `text` | `#F0EAD8` | Primary text (warm off-white) |
| `textDim` | `#6B7294` | Secondary/muted text |
| `textMuted` | `#3D4260` | Tertiary text, skip buttons |
| `ringEmpty` | `#1C2240` | Unfilled SVG ring background |
| `border` | `#1C2240` | Card borders |
| `error` | `#C86E6E` | Permission error messages |

**Typography:**
- Display: `PlayfairDisplay_700Bold` and `PlayfairDisplay_700Bold_Italic`
- Body/UI: System default (no body font specified in theme)

**Spacing scale:** xs=8, sm=16, md=24, lg=40, xl=56, xxl=80

**Radius scale:** sm=8, md=16, lg=24, full=999

---

## App Entry & Bootstrap (`App.js`, `index.js`)

- `SplashScreen.preventAutoHideAsync()` called immediately
- Loads `PlayfairDisplay_700Bold` and `PlayfairDisplay_700Bold_Italic` via `useFonts`
- Hides splash screen via `onLayout` once fonts are ready
- Renders `SafeAreaProvider` → dark `View` (bg `#0A0D17`) → `RootNavigator`
- `StatusBar` forced light

---

## Navigation (`src/navigation/index.js`)

Single flat stack, no tabs. Initial route determined synchronously at startup:

```
Storage.isOnboarded() === false  →  'Welcome'   (first launch)
Storage.isOnboarded() === true
  Storage.isDoneToday() === false  →  'Affirmation'  (open app, ritual pending)
  Storage.isDoneToday() === true   →  'Home'         (ritual already done)
```

**Full route list:**
```
Welcome → Categories → WakeTime → Permissions → Affirmation → Home
```

All transitions use `animation: 'fade'`. No header shown on any screen.

---

## Screens

### Onboarding Flow (3 steps)

#### `WelcomeScreen` (`src/screens/onboarding/WelcomeScreen.js`)
- Fade + slide-up animation on mount (1000ms, native driver)
- Eyebrow: "Good Morning Affirmations", large Playfair Display headline
- One gold pill CTA: "Get started" → navigates to `Categories`
- No data collected here

#### `CategoryScreen` (`src/screens/onboarding/CategoryScreen.js`)
- Step 1 of 3
- 2-column `FlatList` grid of all 15 categories
- Each chip: letter badge (circular) + label
- Multi-select toggle; "Continue (N selected)" button disabled until ≥1 selected
- Passes `categories` array (string IDs) as route param to `WakeTime`

#### `WakeTimeScreen` (`src/screens/onboarding/WakeTimeScreen.js`)
- Step 2 of 3
- Fixed list of 11 preset times: 5:00 AM through 10:00 AM in 30-min increments
- Default selection: 7:00 AM
- Scrollable rows with gold border + dot indicator on selection
- Passes `{ categories, wakeHour, wakeMinute }` to `Permissions`

#### `PermissionsScreen` (`src/screens/onboarding/PermissionsScreen.js`)
- Step 3 of 3
- Requests two permissions in sequence on tap of "Allow and continue":
  1. Microphone + speech recognition (`ExpoSpeechRecognitionModule.requestPermissionsAsync()`)
  2. Notifications (`expo-notifications`)
- Saves to storage: categories, wake time, onboarded flag
- If notifications granted: calls `scheduleDailyAffirmationNotification(hour, minute)`
- Skip option: saves settings, skips permissions, goes straight to Affirmation
- Privacy note: "We do not record, store, or transmit your voice. Speech recognition runs entirely on your device."

---

### Core Screens

#### `AffirmationScreen` (`src/screens/AffirmationScreen.js`)
The most important screen in the app. Entire ritual lives here.

**On mount:**
- Loads categories + seenIds from storage
- Calls `getDailyAffirmation(categories, seenIds)` for today's affirmation
- Reads current streak
- Starts fade + slide animation (800ms)
- Starts a pulsing dot animation (loop, scale 1→1.4→1, 700ms each)
- Auto-starts voice recognition after 600ms

**Layout (top to bottom):**
1. Streak eyebrow — "Day N in a row" (gold, hidden if streak = 0)
2. Label — "Your affirmation" (all-caps, dimmed)
3. Affirmation text — Playfair Display, 34px, centered, max-width 320
4. Instruction — "Say it aloud 3 times"
5. Pulsing mic dot (gold, 8px circle) — visible only while listening
6. Three `RingProgress` SVG rings — fill one by one per rep
7. Count label — "0 / 3", "1 / 3", "2 / 3", "Done"
8. Permission error (if mic denied)
9. Tap fallback — "Tap if mic is unavailable" / "Tap again"
10. Skip button (bottom, absolute) — two-tap confirm: "Skip today" → "Confirm skip"

**Completion flow:**
1. Third rep detected (voice or tap)
2. `handleComplete()` fires:
   - `voice.stop()`
   - `Haptics.notificationAsync(Success)`
   - `Storage.markDoneToday()` → updates streak + lastCompletedDate
   - `Storage.addSeenId(affirmation.id)` → prevents repeat
   - After 1800ms: fade out → `navigation.replace('Home')`

**Skip flow:**
- First tap: shows "Confirm skip"
- Second tap: stops voice, fades out, replaces with Home (no streak change)

#### `HomeScreen` (`src/screens/HomeScreen.js`)
Post-ritual dashboard, read-only.

**Sections:**
1. **Header** — "GMA" (gold, letter-spaced) + "Good Morning Affirmations" (Playfair)
2. **Streak card** — Large Playfair number (72px gold), "X days in a row", hint text if streak = 0
3. **Today's affirmation** — Card with affirmation text + either "Said it" badge (gold) or "Say it now" button
4. **Settings** — Two read-only rows: wake-up reminder time, selected categories (comma-joined)

---

## Data

### Affirmations (`src/data/affirmations.js`)
- **140 total affirmations** across 15 categories
- ~10 per category (wealth has 15)
- Structure: `{ id: string, category: string, text: string }`

**`getDailyAffirmation(selectedCategories, seenIds)`:**
1. Filters AFFIRMATIONS to selected categories (all if none selected)
2. Removes seenIds from pool
3. If pool is empty after filtering → resets to full category pool
4. Picks index: `parseInt(dateStr_YYYYMMDD) % pool.length`
5. Same affirmation shown all day (date-seeded, deterministic)

### Categories (`src/data/categories.js`)
15 categories: `{ id, label, letter }`

| ID | Label | Letter |
|---|---|---|
| wealth | Wealth | W |
| freedom | Financial Freedom | F |
| business | Business | B |
| career | Career | C |
| health | Health | H |
| fitness | Fitness | Fi |
| confidence | Confidence | Co |
| selfesteem | Self-Esteem | S |
| gratitude | Gratitude | G |
| happiness | Happiness | Ha |
| relationships | Relationships | R |
| growth | Personal Growth | P |
| mental | Mental Wellness | M |
| mindfulness | Mindfulness | Mi |
| learning | Learning | L |

---

## Storage (`src/storage/index.js`)

Uses `react-native-mmkv` instance `'gma-storage'`. All reads/writes are synchronous.

| Key | Type | Purpose |
|---|---|---|
| `onboarded` | boolean | Whether onboarding is complete |
| `categories` | JSON string | Array of selected category IDs |
| `wakeHour` | number | Wake-up hour (0–23), default 7 |
| `wakeMinute` | number | Wake-up minute (0–59), default 0 |
| `streak` | number | Current consecutive days count |
| `lastCompletedDate` | string | `YYYY-MM-DD` of last completed ritual |
| `seenAffirmationIds` | JSON string | Array of affirmation IDs already shown |
| `notificationId` | string | ID of the scheduled daily notification |

**Streak logic in `markDoneToday()`:**
- If `lastCompletedDate` === yesterday → `streak + 1`
- Otherwise → streak resets to `1`
- Saves new streak + today's date

**`isDoneToday()`:** Compares `lastCompletedDate` to today's local date string.

---

## Hooks

### `useVoiceRecognition` (`src/hooks/useVoiceRecognition.js`)

Controls the speech recognition session lifecycle.

**Matching algorithm:** Jaccard similarity on normalized word sets
- Normalizes: lowercase, strip punctuation, split to words
- Threshold: **≥ 0.65** to count a rep
- Chosen over exact match to handle real-world imperfect transcription

**Session lifecycle:**
- Each rep is a new `ExpoSpeechRecognitionModule.start()` call (`continuous: false`)
- After successful rep: 900ms cooldown, then restart for next rep
- On session `end` (no-speech timeout): auto-restarts if still active and not in cooldown
- Ignores `no-speech` and `aborted` errors silently
- `activeRef` guards against stale callbacks after stop()

**Returns:** `{ count, isListening, error, start, stop, reset }`

### `useNotifications` (`src/hooks/useNotifications.js`)

- `Notifications.setNotificationHandler` set globally (show alert, no sound, no badge)
- `requestNotificationPermission()` — returns `boolean`
- `scheduleDailyAffirmationNotification(hour, minute)` — cancels existing notification by stored ID, schedules new `DAILY` trigger
- `cancelDailyNotification()` — utility, not currently called from any screen

---

## Components

### `RingProgress` (`src/components/RingProgress.js`)

SVG circular progress ring using `react-native-svg` + `react-native-reanimated` v4.

- Size calculated from `RADIUS=28`, `STROKE=3`: total `SIZE=62px`
- `filled` prop: animates `strokeDashoffset` from full to 0 (1100ms, cubic ease-out) + scale spring (1→1.12→1)
- `active` prop: changes stroke to `goldDim` (currently listening for this rep)
- Idle: stroke is `ringEmpty`

---

## iOS Configuration

**`ios/GMA/Info.plist`:**
- `NSMicrophoneUsageDescription`: set
- `NSSpeechRecognitionUsageDescription`: set
- `UIInterfaceOrientationPortrait` only
- `LSMinimumSystemVersion`: 12.0
- `UIStatusBarStyleLightContent` (forced light status bar)
- `RCTNewArchEnabled`: true

**Permissions in `app.json`:**
- `expo-speech-recognition` plugin with custom permission strings
- `expo-notifications` plugin

**Pods installed:** Yes (`ios/Podfile.lock` present)

---

## Android Configuration

**`android/app/src/main/AndroidManifest.xml`:**
- `INTERNET` — declared
- `SYSTEM_ALERT_WINDOW` — declared (overlay permission, needed for unlock intercept)
- `VIBRATE` — declared
- `READ/WRITE_EXTERNAL_STORAGE` — declared (maxSdkVersion 32)
- `launchMode="singleTask"`

---

## What Is NOT Implemented Yet (Remaining Work)

### Critical — Platform Unlock Interception

**Android (highest priority):**
- `SYSTEM_ALERT_WINDOW` permission is declared in AndroidManifest but **no code uses it**
- Missing: `BroadcastReceiver` for `ACTION_USER_PRESENT` (fires on unlock)
- Missing: Overlay `Activity` with `TYPE_APPLICATION_OVERLAY` that launches at unlock
- Missing: Date flag check to show affirmation only once per day
- Missing: `RECEIVE_BOOT_COMPLETED` permission + re-registration after reboot
- **This is the core differentiating feature and is entirely unbuilt for Android**

**iOS:**
- Screen Time API (FamilyControls + ManagedSettings + DeviceActivity) — **not implemented**
- Requires applying for `com.apple.developer.family-controls` entitlement from Apple
- Missing: `DeviceActivityCenter` schedule to gate apps until affirmation is done
- Missing: Custom `ShieldConfigurationExtension` for the shield UI
- WidgetKit lock screen widget — **not implemented** (shows affirmation before unlock, no entitlement needed)
- Notification deep link: notification `data: { screen: 'Affirmation' }` is set but **no listener in App.js** to navigate on tap

### Settings & Editing
- Wake time is **display-only** in HomeScreen — no way to change it after onboarding
- Categories are **display-only** in HomeScreen — no way to change them after onboarding
- No dedicated Settings screen

### UX Gaps
- No back navigation on any onboarding screen
- WakeTime screen only offers 11 preset times (5–10 AM, 30-min steps) — no custom time picker
- "Skip today" navigates to Home but doesn't record a skip or show any feedback
- Missed-day streak break has no UI acknowledgment (the math resets correctly but nothing tells the user)
- No empty-state if somehow no affirmation is available (edge case)

### Polish / App Store Readiness
- App icon: default Expo placeholder, not customized
- No onboarding illustrations or visuals (text-only currently)
- No paywall / monetization screen
- No About / Privacy Policy screen (required for App Store and Play Store)
- No way for user to see how many unseen affirmations remain before recycling
- `date-fns` is installed but never used — manual date string construction used throughout instead

### Future Features (from original analysis)
- Weekly optional emoji reaction ("How did today's affirmation land?")
- Streak home screen widget
- Voice detection sensitivity tuning (0.65 Jaccard threshold — untested in production)

---

## Key Design Decisions (from Previous Session Analysis)

1. **Jaccard similarity at 0.65** chosen over exact string match because speech recognition transcripts are rarely perfect word-for-word. This allows partial recognition to count.

2. **3 reps instead of 1** — saying the affirmation once can feel passive; three times forces active engagement and spaced repetition.

3. **Tap fallback always visible** — never block the user; voice is enhancement, not gate.

4. **react-native-mmkv over AsyncStorage** — synchronous reads allow `initialRoute()` to be computed synchronously without any loading state or async navigation logic.

5. **Date-seeded affirmation pick** — same affirmation shows all day (no randomness on each app open), so user sees the same one whether they check at 6 AM or come back at noon.

6. **`navigation.replace` throughout** — not `push`. Prevents back-navigation into the ritual or onboarding after completion.

7. **SYSTEM_ALERT_WINDOW declared now** — declared in AndroidManifest proactively so it doesn't require a manifest change when the unlock-intercept feature is built.

8. **Fully offline / no backend** — all data is local. No Supabase or Firebase integrated (the original architecture suggested Supabase, but the implementation went local-only for now).
