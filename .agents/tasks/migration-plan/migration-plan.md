# Kế hoạch Migration: DayTrackV3 → Ionic + Capacitor + TypeScript

> **Ngày lập:** 13/11/2026  
> **Phiên bản hiện tại:** 0.0.1 (Vite + React + shadcn/ui + Tailwind v4)  
> **Mục tiêu:** Ứng dụng mobile-first native cho Android/iOS, giữ toàn bộ logic hiện có

---

## 1. Tóm tắt kiến trúc hiện tại

### Stack hiện tại

| Thành phần | Công nghệ | Chi tiết |
|---|---|---|
| Build tool | **Vite 6.3** | `vite.config.ts`, plugin `@vitejs/plugin-react` |
| Framework UI | **React 18.3** | `HashRouter`, hooks, `useSyncExternalStore` |
| Language | **TypeScript** | `tsconfig` ẩn, `vite-env.d.ts` |
| Styling | **Tailwind CSS v4** | `@tailwindcss/vite`, `default_shadcn_theme.css` |
| Component lib | **shadcn/ui** (Radix UI) | 40+ components trong `src/app/components/ui/` |
| Icons | **Lucide React** | `lucide-react 0.487` |
| Animation | **Motion (Framer Motion v12)** | `motion/react` |
| Routing | **React Router v7** | `HashRouter` + `Routes/Route` |
| State management | **`useSyncExternalStore`** (custom stores) | Không dùng Redux/Zustand; mỗi domain có store riêng |
| Persistence | **`localStorage`** | Tất cả dữ liệu lưu trên browser |
| AI/API | **Gemini 2.5 Flash** | Dual-mode: client-side key (`VITE_GEMINI_API_KEY`) hoặc qua server proxy `api/ai.ts` trên Vercel Edge |
| Notifications | **Web Notifications API** + **`sonner`** toast | `notificationService.ts`, `useNotificationScheduler.ts` |
| Audio | **`HTMLAudioElement`** + **`AudioContext`** (Web API) | `musicEngine.ts`, file mp3 trong `public/audio/fma/` |
| Haptics | **`navigator.vibrate()`** (Web Vibration API) | `notificationService.ts` |
| Deploy | **GitHub Pages** (`/DayTrackV3/`) + **Vercel** (edge functions) | `vite.config.ts → build.outDir = 'docs'` |

### Màn hình / Pages

| Route | File | Chức năng |
|---|---|---|
| `/timetable` | `Timetable.tsx` | Lịch học theo tuần — xem/thêm/xóa schedule blocks |
| `/calendar` | `Calendar.tsx` | Lịch tháng — gán schedule cho ngày cụ thể |
| `/tasks` | `Tasks.tsx` | Danh sách nhiệm vụ (priority: high/medium/low) |
| `/focus` | `Focus.tsx` | Timer tập trung (Pomodoro-style) + nhạc nền |
| `/achive` | `Achive.tsx` | Thành tựu AI-generated |
| `/settings` | `Settings.tsx` | Cài đặt tài khoản, đăng xuất |
| `/profile` | `Profile.tsx` | Thông tin cá nhân + achievements |
| `/notifications` | `Notifications.tsx` | Cài đặt thông báo |
| `/appearance` | `Appearance.tsx` | Theme: light/dark/pastel/auto |
| `/about` | `About.tsx` | Thông tin ứng dụng |
| `/dev/feedbacks` | `DevFeedbackPanel.tsx` | Chỉ hiện với tài khoản developer |
| Login | `Login.tsx` | Đăng nhập / đăng ký (localStorage) |
| Desktop | `DesktopApp.tsx` | Layout riêng khi `window.innerWidth >= 1024` |

### Stores (custom `useSyncExternalStore`)

| File | Storage key | Dữ liệu |
|---|---|---|
| `accountStore.ts` | `daytrack_accounts`, `daytrack_user_data` | Tài khoản, session |
| `scheduleStore.ts` | `daytrack_weekday_schedules` | Lịch theo ngày trong tuần |
| `calendarStore.ts` | `daytrack_calendar_schedules` | Lịch theo ngày cụ thể |
| `achievementStore.ts` | `daytrack_achievements` | Thành tựu AI |
| `feedbackStore.ts` | _(chưa đọc chi tiết)_ | Feedback dev |
| `notificationSettings.ts` | `daytrack_notification_settings` | Cài đặt thông báo |
| `useAppTheme.ts` | `daytrack_theme` | Chủ đề hiển thị |
| `focusLauncher.ts` | `daytrack_pending_focus_seconds` | `sessionStorage` |

---

## 2. Kiến trúc đích: Ionic React + Capacitor + TypeScript

### Tại sao Ionic React (không phải Angular/Vue)?

- **Giữ React**: Toàn bộ component, hook, store hiện tại viết bằng React — không cần rewrite.
- **Ionic React** bọc Ionic components thành React components — tích hợp tự nhiên.
- **Capacitor** là native runtime layer độc lập với framework — không gắn chặt với Angular như Cordova cũ.
- **TypeScript** đã sẵn có — không cần thay đổi.

### Sơ đồ kiến trúc đích

```
┌─────────────────────────────────────────────────────┐
│                    App Shell                         │
│  IonApp → IonRouterOutlet → Pages (IonPage)         │
├─────────────────────────────────────────────────────┤
│  UI Layer                                           │
│  Ionic Components + shadcn/ui + Tailwind CSS v4     │
├─────────────────────────────────────────────────────┤
│  Business Logic (GIỮ NGUYÊN)                        │
│  Custom Stores (useSyncExternalStore) + Hooks        │
├─────────────────────────────────────────────────────┤
│  Persistence Layer (THAY THẾ)                       │
│  localStorage → @capacitor/preferences              │
│  Audio files   → Filesystem + NativeAudio           │
├─────────────────────────────────────────────────────┤
│  Capacitor Native Bridge                            │
│  LocalNotifications / Haptics / StatusBar / ...     │
├──────────────┬──────────────────────────────────────┤
│  Android     │  iOS           │  Web (PWA)           │
│  (WebView)   │  (WKWebView)   │  (browser)           │
└──────────────┴────────────────┴────────────────────-┘
```

### Dependencies đích

```json
{
  "dependencies": {
    "@ionic/react": "^8.x",
    "@ionic/react-router": "^8.x",
    "ionicons": "^7.x",
    "@capacitor/core": "^7.x",
    "@capacitor/app": "^7.x",
    "@capacitor/haptics": "^7.x",
    "@capacitor/keyboard": "^7.x",
    "@capacitor/local-notifications": "^7.x",
    "@capacitor/preferences": "^7.x",
    "@capacitor/splash-screen": "^7.x",
    "@capacitor/status-bar": "^7.x",
    "@capacitor-community/native-audio": "^7.x",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^5.x (dùng bản IonReactRouter dùng v5)"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.x",
    "@capacitor/android": "^7.x",
    "@capacitor/ios": "^7.x",
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x"
  }
}
```

> **Lưu ý:** `@ionic/react-router` dùng React Router v5. Dự án hiện dùng React Router v7 — cần điều chỉnh (xem Phase 2).

---

## 3. Bảng ánh xạ công nghệ

### 3.1 Routing

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `HashRouter` (react-router v7) | `IonReactRouter` + `IonReactHashRouter` | Ionic dùng React Router v5 — downgrade |
| `Routes / Route` | `IonRouterOutlet / Route` | Thêm animation trang tự động |
| `useLocation` | `useLocation` (react-router v5) | API tương tự |
| `Navigate` | `Redirect` (react-router v5) | Đổi tên component |
| `Link` | `IonRouterLink` hoặc `Link` | Cả hai đều dùng được |

### 3.2 Layout & Navigation

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| Custom `BottomNav` (div + motion) | `IonTabBar` + `IonTabButton` | Có animation mặc định, accessible |
| Custom scroll `div` | `IonContent` | Xử lý safe-area, keyboard-resize, rubber-band tự động |
| `PageContainer.tsx` | `IonPage` + `IonHeader` + `IonToolbar` | Ionic page lifecycle |
| Desktop layout (`useIsDesktop`) | Giữ nguyên hoặc dùng `IonSplitPane` | Ionic có IonSplitPane cho tablet/desktop |
| `motion/react` animations | Ionic built-in transition + `motion/react` | Giữ motion cho micro-animations |

### 3.3 UI Components

| shadcn/ui (hiện tại) | Ionic equivalent | Khuyến nghị |
|---|---|---|
| `Dialog` | `IonModal` | Dùng IonModal trên mobile; giữ shadcn cho desktop |
| `Sheet` / `Drawer` | `IonModal` (sheet mode) | `breakpoints` + `initialBreakpoint` |
| `Select` | `IonSelect` / `IonPicker` | IonSelect native trên mobile |
| `Switch` | `IonToggle` | Có haptic feedback tích hợp |
| `Checkbox` | `IonCheckbox` | Style native |
| `Input` / `Textarea` | `IonInput` / `IonTextarea` | Keyboard-aware |
| `Slider` | `IonRange` | |
| `Progress` | `IonProgressBar` | |
| `Tabs` | `IonSegment` | |
| `Toast` (sonner) | `IonToast` | Giữ sonner cũng được |
| `Alert Dialog` | `IonAlert` | |
| `Popover` | `IonPopover` | |
| `Accordion` | `IonAccordion` | |
| `Badge` | `IonBadge` | |
| `Card` | `IonCard` | |
| `Button` | `IonButton` | |
| `Skeleton` | `IonSkeletonText` | |
| `Avatar` | Giữ shadcn | Ionic không có Avatar |
| `Calendar` (react-day-picker) | Giữ react-day-picker | Ionic không có calendar picker |
| `recharts` | Giữ recharts | |
| `react-dnd` | Giữ react-dnd | Cần kiểm tra touch-backend trên mobile |

> **Chiến lược:** Dùng **Ionic components cho các element có UX native quan trọng** (Modal, Tabs, Toggle, Select, Button) và **giữ shadcn/ui cho các component không có equivalent trong Ionic hoặc chỉ hiển thị trên desktop**.

### 3.4 Persistence

| Hiện tại | Đích | Lý do |
|---|---|---|
| `localStorage` (tất cả stores) | `@capacitor/preferences` | localStorage bị clear trên iOS WebView; Preferences dùng UserDefaults (iOS) / SharedPreferences (Android) |
| `sessionStorage` (focusLauncher) | Vẫn dùng `sessionStorage` | Vẫn hoạt động trên Capacitor |

API migration (`Preferences` thay `localStorage`):

```typescript
// TRƯỚC
localStorage.setItem('key', value);
const v = localStorage.getItem('key');
localStorage.removeItem('key');

// SAU
import { Preferences } from '@capacitor/preferences';
await Preferences.set({ key: 'key', value });
const { value: v } = await Preferences.get({ key: 'key' });
await Preferences.remove({ key: 'key' });
```

> ⚠️ Tất cả stores hiện tại là **synchronous** — khi chuyển sang `Preferences` (async), cần thêm layer `async/await` và khởi tạo bất đồng bộ.

### 3.5 Notifications

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `Web Notifications API` | `@capacitor/local-notifications` | Local notifications hoạt động kể cả khi app background trên mobile |
| `useNotificationScheduler` (setInterval) | `LocalNotifications.schedule()` | Schedule cả năm không cần app chạy nền |
| Toast (`sonner`) | Giữ `sonner` hoặc dùng `IonToast` | Giữ sonner đơn giản hơn |

### 3.6 Âm thanh (Audio)

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `HTMLAudioElement` + fade (musicEngine) | `@capacitor-community/native-audio` | Native audio không bị iOS mute, không dừng khi screen lock |
| `AudioContext` (chime) | `@capacitor/haptics` + `NativeAudio` | Chime có thể thay bằng haptic pattern |
| MP3 files trong `public/audio/fma/` | Bundle vào `www/audio/` hoặc dùng `Filesystem` | 25 file mp3 — bundle trực tiếp là đơn giản nhất |

### 3.7 Haptics / Vibration

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `navigator.vibrate()` | `@capacitor/haptics` | `Haptics.vibrate()`, `Haptics.impact()`, `Haptics.notification()` |

### 3.8 AI / API (Gemini)

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `VITE_GEMINI_API_KEY` trong env | **Backend proxy bắt buộc** | Key không được bundle vào native app |
| Vercel Edge Function `api/ai.ts` | Giữ nguyên Vercel API proxy | Capacitor gọi HTTPS tới Vercel endpoint |
| `callProxy('/api/ai', ...)` | `callProxy('https://your-app.vercel.app/api/ai', ...)` | Đổi relative URL thành absolute URL |

### 3.9 Theme

| Hiện tại | Đích | Ghi chú |
|---|---|---|
| `data-theme` attr + `.dark` class | `IonApp` + CSS variables Ionic + custom `data-theme` | Ionic dùng CSS variables (`--ion-background-color`, v.v.) |
| `useAppTheme` + localStorage | Giữ hook, đổi storage sang `Preferences` | |

---

## 4. Lộ trình phân pha

### Phase 0 — Chuẩn bị & Khởi tạo dự án Ionic *(1–2 ngày)*

**Mục tiêu:** Tạo dự án Ionic React mới, cấu hình Capacitor, chạy được trên browser.

**Bước thực hiện:**

```bash
# 1. Tạo dự án Ionic mới (blank template, React)
npm install -g @ionic/cli
ionic start DayTrackV3-ionic blank --type=react --capacitor

# 2. Thêm platforms
cd DayTrackV3-ionic
ionic capacitor add android
ionic capacitor add ios   # (nếu có macOS)

# 3. Cài Capacitor plugins cần thiết
npm install @capacitor/preferences @capacitor/local-notifications \
  @capacitor/haptics @capacitor/status-bar @capacitor/splash-screen \
  @capacitor/keyboard @capacitor-community/native-audio

# 4. Cài Tailwind v4
npm install tailwindcss @tailwindcss/vite
```

**Files cần tạo/sửa:**

| File | Hành động |
|---|---|
| `vite.config.ts` | Thêm `tailwindcss()` plugin, giữ alias `@` |
| `src/styles/global.css` | Import `@import "tailwindcss"` + copy `default_shadcn_theme.css` |
| `src/App.tsx` | Shell với `IonApp` + `IonReactHashRouter` |
| `capacitor.config.ts` | AppId, appName, webDir |
| `src/theme/variables.css` | Ionic CSS variables + map sang theme DayTrack |

**Kết quả verificable:** `ionic serve` chạy được, hiển thị blank app trên browser.

---

### Phase 1 — Migration routing & app shell *(2–3 ngày)*

**Mục tiêu:** Chuyển toàn bộ routing sang `IonReactRouter`, `BottomNav` → `IonTabBar`.

**Files cần sửa:**

| File | Hành động | Chi tiết |
|---|---|---|
| `src/App.tsx` | Rewrite | `IonApp` > `IonReactHashRouter` > `IonRouterOutlet` > `Route` (react-router v5 syntax) |
| `src/app/components/BottomNav.tsx` | Rewrite | `IonTabBar` + `IonTabButton` + `IonIcon` (ionicons) |
| `src/app/components/PageContainer.tsx` | Rewrite | `IonPage` + `IonHeader` + `IonToolbar` + `IonContent` |
| `src/app/pages/*.tsx` | Wrap | Mỗi page bọc bằng `<PageContainer>` mới |
| `src/main.tsx` | Update | Thêm `import '@ionic/react/css/core.css'` và các CSS Ionic |

**Downgrade React Router:**

```bash
npm uninstall react-router
npm install react-router-dom@5 @types/react-router-dom@5
```

> ⚠️ React Router v5 → v7 là breaking change. Các chỗ dùng `useNavigate()` đổi thành `useHistory()`, `Navigate` đổi thành `Redirect`.

**Kết quả verificable:**
- `ionic serve` chạy, navigation giữa tất cả tab hoạt động.
- Animation transition giữa pages hoạt động (slide, fade).
- BottomNav scroll highlight đúng tab active.

---

### Phase 2 — Migration Persistence (localStorage → Preferences) *(3–4 ngày)*

**Mục tiêu:** Tất cả stores chuyển sang `@capacitor/preferences` (async).

**Pattern refactor cho mỗi store:**

```typescript
// src/app/hooks/storage.ts — wrapper đồng bộ hóa
import { Preferences } from '@capacitor/preferences';

export async function storageGet(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  return value;
}
export async function storageSet(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}
export async function storageRemove(key: string): Promise<void> {
  await Preferences.remove({ key });
}
```

**Files cần sửa:**

| File | Hành động |
|---|---|
| `src/app/hooks/accountStore.ts` | Đổi `localStorage` → `Preferences`, thêm `async/await`, thêm `initStore()` |
| `src/app/hooks/scheduleStore.ts` | Đổi sang async, cập nhật `emit()` |
| `src/app/hooks/calendarStore.ts` | Đổi sang async |
| `src/app/hooks/achievementStore.ts` | Đổi sang async |
| `src/app/hooks/notificationSettings.ts` | Đổi sang async |
| `src/app/hooks/useAppTheme.ts` | Đổi sang async |
| `src/App.tsx` | Thêm `initAllStores()` trước render, hiển thị splash trong lúc load |

**Kết quả verificable:**
- Tắt app, mở lại → dữ liệu vẫn còn.
- Test trên Android emulator: dữ liệu tồn tại sau khi clear browser cache (vì dùng SharedPreferences, không phải WebView storage).

---

### Phase 3 — Migration Notifications *(2–3 ngày)*

**Mục tiêu:** Thay Web Notifications API bằng `@capacitor/local-notifications`.

**Files cần sửa:**

| File | Hành động |
|---|---|
| `src/app/hooks/notificationService.ts` | Rewrite `notify()`, `requestPermission()` |
| `src/app/hooks/useNotificationScheduler.ts` | Rewrite: thay `setInterval` bằng `LocalNotifications.schedule()` |

**Code mẫu:**

```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestPermission() {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
}

export async function scheduleNotification(title: string, body: string, at: Date) {
  await LocalNotifications.schedule({
    notifications: [{
      id: Date.now(),
      title,
      body,
      schedule: { at },
      sound: 'default',
      smallIcon: 'ic_stat_icon_config_sample',
    }]
  });
}
```

**Kết quả verificable:**
- Trên Android emulator: notification xuất hiện đúng giờ cài đặt.
- Notification hoạt động khi app ở background.

---

### Phase 4 — Migration Audio *(2–3 ngày)*

**Mục tiêu:** Thay `HTMLAudioElement` bằng `@capacitor-community/native-audio`.

**Files cần sửa:**

| File | Hành động |
|---|---|
| `src/app/hooks/musicEngine.ts` | Rewrite dùng `NativeAudio.preload()` + `NativeAudio.play()` + `NativeAudio.setVolume()` |
| `src/app/hooks/musicData.ts` | Giữ nguyên (chỉ định nghĩa Song[] với src path) |
| `capacitor.config.ts` | Không cần config đặc biệt |

**Lưu ý quan trọng:**
- Pre-load các file audio khi app start (không phải khi play).
- Chuyển audio files từ `public/audio/` → `src/assets/audio/` (Vite bundle) hoặc giữ trong `public/` (copy sang `www/`).
- iOS: cần `NSMicrophoneUsageDescription` trong `Info.plist` (nếu dùng AudioSession).
- Haptic chime: dùng `Haptics.notification({ type: NotificationType.Success })` thay cho AudioContext.

**Kết quả verificable:**
- Nhạc phát khi vào tab Focus.
- Nhạc tiếp tục khi khóa màn hình (iOS Background Audio entitlement).
- Fade-in/out hoạt động.

---

### Phase 5 — Migration Haptics *(0.5 ngày)*

**Mục tiêu:** Thay `navigator.vibrate()` bằng `@capacitor/haptics`.

**File cần sửa:** `src/app/hooks/notificationService.ts`

```typescript
// TRƯỚC
navigator.vibrate?.([200, 100, 200]);

// SAU
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function vibrate() {
  await Haptics.impact({ style: ImpactStyle.Medium });
}
export async function notifyHaptic() {
  await Haptics.notification({ type: NotificationType.Success });
}
```

**Kết quả verificable:** Rung khi nhận notification trên Android/iOS thực.

---

### Phase 6 — AI & API security trên mobile *(1–2 ngày)*

**Mục tiêu:** Đảm bảo API key không bị expose, CORS hoạt động.

**Files cần sửa:**

| File | Hành động |
|---|---|
| `src/app/services/gemini.ts` | Xóa `callGoogle()` (direct call với key), chỉ giữ `callProxy()` |
| `src/app/services/gemini.ts` | Đổi `PROXY_PATH = '/api/ai'` thành `PROXY_PATH = 'https://your-app.vercel.app/api/ai'` hoặc đọc từ `import.meta.env.VITE_API_BASE_URL` |
| `api/ai.ts` (Vercel) | Thêm Capacitor app origin vào `ALLOWED_ORIGINS` |
| `.env` | `VITE_API_BASE_URL=https://your-app.vercel.app` |
| `capacitor.config.ts` | Config `server.hostname` cho dev mode |

**Lý do bỏ direct key call:** Khi build thành APK/IPA, `VITE_GEMINI_API_KEY` sẽ bị bundle vào file JS tĩnh — bất kỳ ai decompile app đều thấy key.

**Vấn đề CORS trên mobile:**
- Request từ Capacitor có `Origin: capacitor://localhost` (iOS) hoặc `Origin: http://localhost` (Android).
- Cần thêm các origin này vào `ALLOWED_ORIGINS` trên Vercel.
- Hoặc detect: nếu không có `Origin` header (native WebView), cho phép qua một secret header.

```typescript
// api/ai.ts — thêm vào allowed origins check
const nativeOrigins = ['capacitor://localhost', 'http://localhost', 'ionic://localhost'];
const isNative = nativeOrigins.some(o => origin === o);
const isAllowed = isSameOrigin || allowedOrigins.includes(origin!) || isNative;
```

**Kết quả verificable:**
- Gọi AI từ app Capacitor (Android emulator) → trả về kết quả.
- Không có `VITE_GEMINI_API_KEY` trong bundle.

---

### Phase 7 — UI polish & Ionic components *(3–5 ngày)*

**Mục tiêu:** Thay thế các shadcn components key bằng Ionic equivalent để UX native hơn.

**Danh sách thay thế ưu tiên:**

| Component | File(s) sử dụng | Action |
|---|---|---|
| `IonModal` thay `Dialog` | `AiPlannerModal`, `BusyHoursModal`, `CreateScheduleModal`, `TimePickerModal`, `AvatarModal` | Rewrite props interface |
| `IonModal` sheet-mode thay `Sheet`/`Drawer` | _(nếu có)_ | Thêm `breakpoints`, `initialBreakpoint` |
| `IonToggle` thay `Switch` | `Notifications.tsx`, `Appearance.tsx` | 1:1 replacement |
| `IonInput` thay `Input` | `Login.tsx`, form screens | Thêm `IonItem` wrapper |
| `IonSelect` thay `Select` | Settings, Profile | Native picker trên mobile |
| `IonList` + `IonItem` | Settings, Notifications | List UX native |
| `IonRefresher` | Timetable, Calendar, Tasks | Pull-to-refresh |
| `IonInfiniteScroll` | Tasks (nếu có nhiều items) | Nếu cần |
| `IonFab` thay action button | BottomNav action button | FAB native |
| `StatusBar.setStyle()` | App.tsx | Light/dark status bar theo theme |

**Kết quả verificable:**
- UI test trên Android emulator: tất cả modal, toggle, input hoạt động native.
- Không có lỗi overflow, z-index conflict giữa Ionic và shadcn.

---

### Phase 8 — Native configuration & build *(2–3 ngày)*

**Mục tiêu:** Build APK/IPA được, cấu hình app icon và splash screen.

**Files cần tạo/sửa:**

| File | Hành động |
|---|---|
| `capacitor.config.ts` | AppId đúng (`com.daytrack.app`), appName, plugins config |
| `android/app/src/main/res/` | App icon (drawable-* folders) |
| `android/app/src/main/AndroidManifest.xml` | Permissions: `INTERNET`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `VIBRATE` |
| `ios/App/App/Info.plist` | Usage descriptions (Notifications, Audio) |
| `src/assets/icon.png` | 1024×1024 app icon |
| `src/assets/splash.png` | 2732×2732 splash screen |

```bash
# Install icon/splash generator
npm install @capacitor/assets --save-dev
npx @capacitor/assets generate

# Build web assets
ionic build

# Sync to native
npx cap sync

# Open in Android Studio
npx cap open android
```

**Kết quả verificable:**
- Build APK debug thành công từ Android Studio.
- App cài được trên Android emulator/device.
- App icon và splash screen hiển thị đúng.

---

### Phase 9 — Testing & QA *(3–5 ngày)*

**Mục tiêu:** Kiểm thử toàn bộ user flow trên device thực.

**Checklist:**

- [ ] Đăng nhập / đăng ký → persist sau restart
- [ ] Timetable: thêm/xóa/sửa schedule block
- [ ] Calendar: gán lịch cho ngày cụ thể
- [ ] Tasks: thêm/hoàn thành/xóa task
- [ ] Focus: timer đếm ngược, nhạc nền, haptic
- [ ] Achievements: AI generate, progress tracking
- [ ] Notifications: schedule notification, nhận khi background
- [ ] Theme: light/dark/pastel/auto (follow system)
- [ ] AI Planner: gọi Gemini qua proxy, hiển thị kết quả
- [ ] Desktop layout: responsive trên tablet

---

## 5. Capacitor Plugins tổng hợp

| Plugin | npm package | Mục đích | Platforms |
|---|---|---|---|
| Preferences | `@capacitor/preferences` | Thay localStorage | Android, iOS, Web |
| Local Notifications | `@capacitor/local-notifications` | Thông báo lên lịch | Android, iOS |
| Haptics | `@capacitor/haptics` | Rung/haptic feedback | Android, iOS |
| Status Bar | `@capacitor/status-bar` | Màu status bar theo theme | Android, iOS |
| Splash Screen | `@capacitor/splash-screen` | Màn hình khởi động | Android, iOS |
| Keyboard | `@capacitor/keyboard` | Xử lý keyboard resize | Android, iOS |
| App | `@capacitor/app` | Deep link, app lifecycle, back button | Android, iOS |
| Native Audio | `@capacitor-community/native-audio` | Nhạc nền Focus | Android, iOS |

---

## 6. Chiến lược Styling: Tailwind + shadcn/ui song song Ionic

### Vấn đề xung đột

Ionic dùng CSS variables toàn cục (`--ion-*`) và inject `ion-app`, `ion-content` với `position: fixed/absolute`. Tailwind reset (`@tailwind base`) có thể conflict.

### Giải pháp

1. **Giữ Tailwind v4** — không xóa.
2. **Import Ionic CSS có chọn lọc** — không import `@ionic/react/css/normalize.css` (đã có Tailwind reset):

```css
/* src/main.css — chỉ import những gì cần */
@import "@ionic/react/css/core.css";
@import "@ionic/react/css/structure.css";   /* IonApp layout */
@import "@ionic/react/css/typography.css";
/* BỎ: normalize.css, display.css, flex.css (Tailwind xử lý) */
```

3. **Scope shadcn/ui** trong container cụ thể để tránh override Ionic:

```css
.shadcn-scope {
  /* Reset về default Tailwind bên trong */
}
```

4. **Ionic components** sử dụng CSS variables — override trong `src/theme/variables.css`:

```css
:root {
  --ion-color-primary: #3b82f6;    /* blue-500 */
  --ion-color-primary-rgb: 59,130,246;
  --ion-background-color: var(--background); /* từ shadcn theme */
  --ion-text-color: var(--foreground);
}
```

5. **Tailwind utilities** dùng bình thường trong tất cả component — `className="flex items-center gap-2"` không bị ảnh hưởng.

---

## 7. Chiến lược State Management & Routing

### State Management

Giữ nguyên pattern `useSyncExternalStore` hiện tại — không cần Zustand/Redux. Chỉ cần:
- Thêm `async` cho storage operations.
- Thêm `isLoading` state khi load từ Preferences.
- Pattern `initStore()` async chạy trước `ReactDOM.render`.

### Routing

```
IonReactHashRouter (giữ hash-based routing cho web deploy tương thích)
  └── IonRouterOutlet
       ├── Route path="/timetable" → Timetable
       ├── Route path="/calendar"  → Calendar
       ├── Route path="/tasks"     → Tasks
       ├── Route path="/focus"     → Focus
       ├── Route path="/achive"    → Achive
       └── Route path="/settings" → Settings
           └── Nested: Profile, Notifications, Appearance, About
```

**Back button (Android):**
```typescript
import { App } from '@capacitor/app';
App.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) window.history.back();
  else App.exitApp();
});
```

---

## 8. Rủi ro & Giải pháp

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| React Router v7 → v5 downgrade | 🔴 Cao | Kiểm tra kỹ tất cả nơi dùng `useNavigate`, `Navigate`, `Outlet` — đây là thay đổi breaking lớn nhất |
| iOS WebView audio bị mute | 🔴 Cao | Dùng `@capacitor-community/native-audio`, xin Audio Background Mode entitlement |
| localStorage bị clear trên iOS | 🔴 Cao | Migrate sang `@capacitor/preferences` ở Phase 2 |
| CORS từ Capacitor native origin | 🟡 Trung bình | Whitelist `capacitor://localhost`, `http://localhost` trong Vercel API |
| API key exposure trong bundle | 🟡 Trung bình | Xóa `callGoogle()` direct, chỉ dùng proxy |
| Xung đột CSS Tailwind ↔ Ionic | 🟡 Trung bình | Import Ionic CSS có chọn lọc, scope shadcn |
| `react-dnd` không có touch-backend | 🟡 Trung bình | Thêm `react-dnd-touch-backend` cho mobile |
| 25 file MP3 (25+ MB) tăng bundle size | 🟡 Trung bình | Lazy load audio, chỉ preload khi vào Focus tab |
| `AudioContext` không hoạt động trên iOS WebView | 🟢 Thấp | Dùng NativeAudio thay toàn bộ AudioContext |
| `window.dispatchEvent` (focusLauncher) | 🟢 Thấp | Vẫn hoạt động trong Capacitor WebView |
| Desktop layout (useIsDesktop) | 🟢 Thấp | Vẫn dùng được; xem xét `IonSplitPane` cho tablet |

---

## 9. Chiến lược Test

| Loại test | Tool | Phạm vi |
|---|---|---|
| Unit test (logic) | **Vitest** | Stores, services, AI parsers |
| Component test | **React Testing Library** + Vitest | Pages, components (web mode) |
| E2E web | **Playwright** | Toàn bộ user flow trên browser |
| E2E mobile | **Appium** hoặc **Detox** | Smoke test trên Android emulator |
| Manual device test | Android/iOS thực | Audio, notifications, haptics |

---

## 10. Ước lượng khối lượng công việc

| Phase | Mô tả | Effort |
|---|---|---|
| Phase 0 | Khởi tạo dự án Ionic, cài đặt | 1–2 ngày |
| Phase 1 | Routing + App Shell | 2–3 ngày |
| Phase 2 | Persistence (localStorage → Preferences) | 3–4 ngày |
| Phase 3 | Notifications | 2–3 ngày |
| Phase 4 | Audio (NativeAudio) | 2–3 ngày |
| Phase 5 | Haptics | 0.5 ngày |
| Phase 6 | AI/API security | 1–2 ngày |
| Phase 7 | UI polish (Ionic components) | 3–5 ngày |
| Phase 8 | Build native (APK/IPA) | 2–3 ngày |
| Phase 9 | Testing & QA | 3–5 ngày |
| **Tổng** | | **~20–31 ngày (1 dev)** |

> Có thể song song hoá: Phase 3–5 (Notifications/Audio/Haptics) chạy độc lập nhau.  
> Phase 7 (UI polish) có thể thực hiện incremental song song với Phase 3–6.

---

## 11. Cấu trúc thư mục đích

```
DayTrackV3-ionic/
├── android/                    ← Capacitor Android project
├── ios/                        ← Capacitor iOS project
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── BottomNav.tsx   ← IonTabBar version
│   │   │   ├── PageContainer.tsx ← IonPage wrapper
│   │   │   └── ui/             ← shadcn/ui (giữ nguyên)
│   │   ├── hooks/
│   │   │   ├── storage.ts      ← NEW: Preferences wrapper
│   │   │   ├── accountStore.ts ← async Preferences
│   │   │   └── ...             ← các stores khác (async)
│   │   ├── pages/              ← Giữ nguyên, wrap IonPage
│   │   ├── services/
│   │   │   └── gemini.ts       ← Chỉ callProxy(), absolute URL
│   │   └── App.tsx             ← IonApp + IonReactHashRouter
│   ├── theme/
│   │   └── variables.css       ← Ionic CSS vars mapped to DayTrack colors
│   ├── styles/
│   │   └── global.css          ← Tailwind + shadcn theme
│   └── main.tsx                ← initStores() async trước render
├── shared/
│   └── ai.ts                   ← Giữ nguyên
├── api/
│   └── ai.ts                   ← Giữ nguyên (Vercel edge)
├── capacitor.config.ts
├── package.json
└── vite.config.ts
```

---

## 12. Quick wins (có thể làm ngay không cần migration hoàn chỉnh)

Những cải thiện có thể áp dụng ngay vào codebase hiện tại (trước khi migration) để giảm rủi ro:

1. **Đóng gói storage calls** vào một file `src/app/hooks/storage.ts` với interface `get/set/remove` — sau này chỉ cần đổi implementation.
2. **Tách `callGoogle()` khỏi `gemini.ts`** bằng flag `import.meta.env.MODE` — dễ xóa khi lên mobile.
3. **Test trên thiết bị Android Chrome** (không phải emulator) ngay bây giờ để phát hiện các vấn đề CSS/touch sớm.
4. **Chuyển `sessionStorage` trong `focusLauncher.ts` thành in-memory** — sessionStorage không cần thiết trên native app.

---

*Tài liệu này được tạo tự động bằng phân tích codebase DayTrackV3-main tại ngày 13/11/2026.*
