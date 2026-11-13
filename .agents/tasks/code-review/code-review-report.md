# Báo cáo rà soát mã nguồn DayTrack

Đây là báo cáo rà soát **read-only** toàn bộ dự án DayTrack (Vite 6 + React 18 + TypeScript, tích hợp Google Gemini). Mọi vấn đề đều dẫn chứng `file:dòng` cụ thể dựa trên mã đã đọc. Các mục đánh dấu *(cần xác minh khi chạy)* là những điểm logic nghi vấn cần kiểm tra runtime, không khẳng định chắc mà chưa chạy được.

> Ghi chú môi trường: trên máy này không chạy được `tsc --noEmit` vì (1) không có `tsconfig.json`, (2) `typescript` không nằm trong devDependencies, (3) PowerShell chặn `npx` (ExecutionPolicy). Do đó phần kiểm tra kiểu tĩnh được suy luận từ mã nguồn chứ không chạy được công cụ.

## Tóm tắt

Dự án có nền tảng tốt: dùng `useSyncExternalStore` cho store (scheduleStore/calendarStore/achievementStore), parse chặt chẽ output AI bằng các hàm `normalize*` (chống prompt-injection ở đầu ra), có mô hình bảo mật AI tách biệt key client/server, và không có `console.log` sót lại. Tuy nhiên có một số lỗi logic nghiêm trọng ở luồng thông báo và ngày giờ, cấu hình deploy sai, thiếu hoàn toàn type-checking/lint/test, và nhiều vấn đề về accessibility.

### Thống kê số lượng vấn đề

| Mức độ | Số lượng |
|---|---|
| CRITICAL | 1 |
| HIGH | 8 |
| MEDIUM | 22 |
| LOW | 16 |
| **Tổng** | **47** |

| Nhóm | Số lượng |
|---|---|
| 1. Bugs & correctness | 12 |
| 2. TypeScript quality | 5 |
| 3. Security | 7 |
| 4. Performance | 6 |
| 5. React & architecture | 7 |
| 6. API / edge function | 3 |
| 7. Accessibility & UX | 7 |
| 8. Maintainability & conventions | 8 |
| 9. Build / config / deploy | 6 |

---

## Mục lục
1. [Bugs & correctness](#1-bugs--correctness)
2. [TypeScript quality](#2-typescript-quality)
3. [Security](#3-security)
4. [Performance](#4-performance)
5. [React & architecture](#5-react--architecture)
6. [API / edge function](#6-api--edge-function)
7. [Accessibility & UX](#7-accessibility--ux)
8. [Maintainability & conventions](#8-maintainability--conventions)
9. [Build / config / deploy](#9-build--config--deploy)
10. [TOP 10 ưu tiên](#top-10-vấn-đề-nên-sửa-trước)

---

## 1. Bugs & correctness

### 1.1 Thông báo lặp lại mỗi 20 giây — log dedup bị xóa nhầm mỗi tick
- **Mức độ:** HIGH
- **File + dòng:** `src/app/hooks/useNotificationScheduler.ts:121-128` (hàm `tick()`)
- **Mô tả:** Mỗi tick (20s) mã làm `const log = readLog().filter(k => !k.startsWith(key + ':'))` — lọc **bỏ** đúng các key của hôm nay. Sau đó `fired = (k) => log.includes(k)` luôn trả `false` với mọi key hôm nay → các nhắc (bắt đầu lịch, nhắc 5 phút, tổng kết sáng/tối…) **kích hoạt lại ở mỗi tick** trong suốt cửa sổ thời gian. Ví dụ "tổng kết buổi tối" (cửa sổ 20 phút, `WINDOW_MS`) sẽ báo ~60 lần. Hơn nữa vì chỉ bỏ key hôm nay mà giữ key ngày cũ, log **cứ phình ra vô hạn** (không prune ngày cũ).
- **Gợi ý sửa:** Đảo chiều filter để **giữ** key hôm nay và prune ngày cũ, ví dụ `readLog().filter(k => k.startsWith(recentKeyPrefix))` hoặc tách riêng: đọc log, loại bỏ entry cũ hơn `WINDOW_MS`, và **giữ** entry hôm nay để dedup. `fired` phải tra cứu trong log đã **giữ** hôm nay.

### 1.2 `JSON.parse` localStorage không có try/catch → crash trắng màn hình khi dữ liệu hỏng
- **Mức độ:** HIGH
- **File + dòng:** `src/app/App.tsx:62` và `src/app/App.tsx:68` (trong `useEffect` khởi động)
- **Mô tả:** `setUserData(JSON.parse(savedUserData))` và `setGlobalTasks(JSON.parse(savedTasks))` không bọc `try/catch`. Nếu `localStorage` chứa JSON hỏng (ghi dở, migrate sai, extension chèn vào), `JSON.parse` ném lỗi → component App văng lỗi khi load → màn hình trắng, không có ErrorBoundary (xem 5.1) để gỡ. Toàn bộ `JSON.parse` khác trong dự án đều có try/catch, riêng 2 chỗ này thì không.
- **Gợi ý sửa:** Bọc try/catch, parse thất bại thì xóa key hỏng và dùng giá trị mặc định (giống pattern trong `scheduleStore.ts:10-23`).

### 1.3 Định dạng `dateKey` không nhất quán → nhiệm vụ "hằng ngày" không cộng tiến độ thành tựu
- **Mức độ:** HIGH
- **File + dòng:**
  - `src/app/hooks/useTasks.ts:43` — `todayKey = ${year}-${month+1}-${date}` **không zero-pad** → `"2024-1-5"`
  - `src/app/hooks/achievementStore.ts:81-84` — `todayKey()` **zero-pad** → `"2024-01-05"`
  - `src/app/hooks/useNotificationScheduler.ts:38-39` và `src/app/hooks/calendarStore.ts` (`dateKey`) — cũng **không zero-pad**
- **Mô tả:** `useTasks.toggleTask` ghi `completedDate = todayKey` (không pad, vd `"2024-1-5"`). `achievementStore.isTaskDone` so `task.completedDate === todayKey()` (có pad `"2024-01-05"`) → **không khớp** với tháng/ngày < 10 → nhiệm vụ hằng ngày hoàn thành **không được tính** vào tiến độ thành tựu vào các tháng 1-9 và ngày 1-9. Tương tự scheduler (`isCompletedToday`) cũng dùng key không pad nên dễ lệch với bất kỳ nơi nào dùng pad.
- **Gợi ý sửa:** Tạo một helper `dateKey(date)` duy nhất (zero-pad YYYY-MM-DD) dùng chung cho cả tasks, achievements, scheduler, calendarStore; thay tất cả chuỗi format rời rạc bằng helper này. *(cần xác minh khi chạy)* nhưng chênh format là chắc chắn.

### 1.4 Dải tuần trong Tasks lệch vào Chủ Nhật
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/hooks/useTasks.ts:47-54` (`weekDays`)
- **Mô tả:** Công thức `d.setDate(today.getDate() - today.getDay() + i + 1)`. Khi hôm nay là **Chủ Nhật** (`getDay()===0`), i=0 → `today.getDate()+1` = **thứ Hai tuần sau**, cả 7 ô không chứa hôm nay → ô "hôm nay" không highlight và dải hiển thị sai tuần. `useTimetable.ts` tính Monday đúng bằng `mondayOffset = (today.getDay()+6)%7` — đây là 2 công thức khác nhau cho cùng mục đích, 1 sai 1 đúng.
- **Gợi ý sửa:** Dùng chung công thức `mondayOffset = (today.getDay()+6)%7` rồi `weekDates[i] = today - mondayOffset + i`.

### 1.5 Lịch không chuyển được năm
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/hooks/useCalendar.ts:38` (`const [currentYear] = useState(today.getFullYear())`)
- **Mô tả:** `currentYear` destructured **không có setter** → không bao giờ đổi năm. Nút chuyển tháng (`Calendar.tsx`) kẹp `currentMonth` trong 0–11 nên chỉ xem được 12 tháng của **năm hiện tại**. Nếu hôm nay là tháng 12, bấm "tháng sau" bị kẹp ở tháng 11; không xem được tháng 1 năm sau.
- **Gợi ý sửa:** Cho `currentYear` có setter, khi `currentMonth > 11` thì tăng năm và modulo, `< 0` thì giảm năm. *(cần xác minh khi chạy)* flow điều hướng.

### 1.6 Tạo khối lịch không kiểm tra `end > start`
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/components/CreateScheduleModal.tsx` (hàm `handleSubmit`, không có validate)
- **Mô tả:** Dùng `<input type="time">` cho `timeStart`/`timeEnd` nhưng không kiểm tra kết thúc > bắt đầu. Nếu người dùng đặt `09:00 - 10:00` ngược thành `10:00 - 09:00`, block lưu với `time: "10:00 - 09:00"`. Scheduler (`useNotificationScheduler`) tính `block.end - block.start` âm, điều kiện `nowMs >= startTs && nowMs < endTs` (endTs < startTs) không bao giờ true → lịch "không bao giờ bắt đầu".
- **Gợi ý sửa:** Thêm validate `toMinutes(timeEnd) > toMinutes(timeStart)` trước khi save, báo lỗi bằng toast inline.

### 1.7 Tính `initials` crash khi tên có khoảng trắng dư
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/pages/Settings.tsx` và `src/app/pages/Profile.tsx` (biểu thức `initials`)
- **Mô tả:** `userData.name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()`. Nếu `name` có khoảng trắng dư ở cuối (vd `"Nguyễn "`) thì `split` ra `['Nguyễn','']`, `w[0]` với `w=''` là `undefined`, `.toUpperCase()` trên `undefined` → **TypeError**, crash cả trang. Dù login mặc định name hợp lệ, dữ liệu cũ/sửa tên có thể dính.
- **Gợi ý sửa:** `userData.name.trim().split(/\s+/).filter(Boolean).map(w => w[0])...`.

### 1.8 Timer effect tạo lại `setInterval` mỗi giây
- **Mức độ:** LOW
- **File + dòng:** `src/app/hooks/useFocus.ts` (effect `[isRunning, currentTime]`)
- **Mô tả:** Vì `currentTime` nằm trong deps, mỗi giây effect cleanup+set lại interval → tạo/hủy interval mỗi giây. Không leak (có cleanup) nhưng dư thừa. Tương tự effect `nav:quick-action` đăng ký lại listener mỗi giây khi đang chạy (deps gồm `currentTime`).
- **Gợi ý sửa:** Dùng `useRef` giữ interval set 1 lần, callback dùng functional update; hoặc dùng `setInterval` cố định + `useRef` cho giá trị mới nhất.

### 1.9 `setTimeout` trong useFocus không clear khi unmount
- **Mức độ:** LOW
- **File + dòng:** `src/app/hooks/useFocus.ts` (`setCircleScale`/`setIsShaking` setTimeout)
- **Mô tả:** `setTimeout(() => setCircleScale(1), 150)` và `setTimeout(() => setIsShaking(false), 500)` không clear. React 18 không warn nhưng vẫn setState sau unmount (lãng phí). Nên lưu id timeout vào ref và clear.

### 1.10 Cache AI không có TTL, phình bộ nhớ
- **Mức độ:** LOW
- **File + dòng:** `src/app/services/gemini.ts:110-119` (`const cache = new Map`)
- **Mô tả:** Cache module-level lưu Promise kết quả thành công **mãi mãi** (chỉ xóa khi lỗi hoặc gọi `clearAiCache`). Trong phiên dài, số entry tăng không giới hạn. Cũng là lý do kết quả AI cũ bị dùng lại (cùng input trả cache). Nên thêm TTL (vd 5 phút) hoặc giới hạn số entry (LRU).

### 1.11 Store không đồng bộ đa tab
- **Mức độ:** LOW
- **File + dòng:** `src/app/hooks/scheduleStore.ts`, `calendarStore.ts`, `achievementStore.ts` (toàn bộ store)
- **Mô tả:** Các store dùng `useSyncExternalStore` + ghi `localStorage` trên `emit()`, nhưng không lắng nghe sự kiện `storage` → mở 2 tab, tab A sửa lịch thì tab B giữ state in-memory cũ, ghi đè mất khi tab B lưu tiếp.
- **Gợi ý sửa:** Thêm `window.addEventListener('storage', ...)` để reload state khi tab khác ghi, hoặc dùng BroadcastChannel.

### 1.12 BusyHoursModal: busy pairs không persist giữa các lần mở
- **Mức độ:** LOW
- **File + dòng:** `src/app/components/BusyHoursModal.tsx` (state `pairs` chỉ tồn tại trong modal)
- **Mô tả:** Các khung giờ bận người dùng kéo chọn chỉ được dùng khi bấm "Gọi AI"; bấm "Xong"/"Hủy" đều `onClose` và pairs mất. Mở lại modal là rỗng. Nút "Xong" có ngữ nghĩa "lưu" nhưng hành vi giống "Hủy". UX gây nhầm.

---

## 2. TypeScript quality

### 2.1 Không có `tsconfig.json` → build không kiểm tra kiểu
- **Mức độ:** HIGH
- **File + dòng:** thiếu hoàn toàn `tsconfig*.json` ở root; `package.json` không có `typescript` trong devDependencies, không có script `typecheck`
- **Mô tả:** `vite build` dùng esbuild **bỏ qua** type mà không kiểm tra → toàn bộ lỗi kiểu (vd lỗi 7.2/Achive color mismatch tiềm ẩn) chạy thẳng vào production mà không báo. Lỗ hổng loại này chính là gốc rễ cho nhiều bug ở mục 5.3 (Profile nhận prop `color` nhưng dữ liệu truyền `barColor`).
- **Gợi ý sửa:** Thêm `tsconfig.json` (strict, noUncheckedIndexedAccess), thêm dep `typescript` và script `"typecheck": "tsc --noEmit"`, chạy trong CI và trước build.

### 2.2 Dùng `any` cho prop `icon` ở 6 chỗ
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/pages/Profile.tsx:18`, `src/app/pages/Login.tsx:29`, `src/app/desktop/sections/DesktopProfile.tsx:16,30`, `src/app/hooks/useAchive.ts:16`, `src/app/desktop/DesktopLogin.tsx:28`, `src/app/components/BottomNav.tsx:16`
- **Mô tả:** `icon: any` cho component icon Lucide → mất kiểu, IDE không gợi ý. Nên dùng `LucideIcon` (từ `lucide-react`) hoặc `React.ComponentType<{ className?: string }>`.

### 2.3 `buildPrompt` ép kiểu `unknown` mà không validate đầu vào
- **Mức độ:** MEDIUM
- **File + dòng:** `shared/ai.ts` (hàm `buildPrompt`, các `input as AnalyzeScheduleInput`...)
- **Mô tả:** `buildPrompt(action: AiAction, input: unknown)` rồi `input as AnalyzeScheduleInput` — `input` từ request body là **không tin cậy** (edge function) nhưng ép kiểu thẳng, các prompt builder truy cập `input.busy.length`, `input.schedule.map` mà không kiểm tra. Tuy có `MAX_BODY_BYTES` chặn dung lượng nhưng mảng vẫn không bị chặn số phần tử trước khi ghép prompt.
- **Gợi ý sửa:** Thêm hàm validate runtime (zod hoặc thủ công) cho mỗi action trước khi build, hoặc cap mảng `schedule`/`tasks`/`busy` trước khi đưa vào prompt.

### 2.4 Non-null assertion sai ngữ cảnh
- **Mức độ:** LOW
- **File + dòng:** `src/app/components/BusyHoursModal.tsx` (`clearTimeout(lpTimer.current!)`)
- **Mô tả:** `lpTimer.current` có thể `null` nhưng dùng `!` ép non-null. `clearTimeout(null)` không gây lỗi runtime nhưng đây là dấu hiệu kiểu không trung thực. Nên `if (lpTimer.current) clearTimeout(lpTimer.current)`.

### 2.5 Khai báo `process` thủ công trong edge function
- **Mức độ:** LOW
- **File + dòng:** `api/ai.ts:3` (`declare const process`)
- **Mô tả:** Tự khai báo type `process` thay vì dùng `@types/node`/Vercel edge types. Vẫn chạy được nhưng bỏ qua autocomplete cho các field khác. Nên tham chiếu `vite/client` hoặc edge runtime types.

---

## 3. Security

### 3.1 Rate-limit map clear wholesale → khuếch đại DoS
- **Mức độ:** HIGH
- **File + dòng:** `api/ai.ts:27` (`if (hits.size > 5000) hits.clear()`)
- **Mô tả:** Khi Map `hits` quá 5000 entry thì `hits.clear()` **xóa toàn bộ** → tất cả rate-limit của mọi IP bị reset. Kẻ tấn công chỉ cần phát 5000 request từ 5000 IP khác nhau (hoặc xoay IP) là đặt lại counter cho tất cả → mọi client đều bypass giới hạn 20 req/phút. Kèm theo không có expiry sweep (entry cũ chỉ bị lọc khi IP đó quay lại), bộ nhớ phình đến 5000 rồi xóa sạch.
- **Gợi ý sửa:** Dùng sliding-window với TTL riêng từng entry (Map<ip, timestamp[]>, prune `now - t > WINDOW_MS` định kỳ và giới hạn size bằng eviction LRU thay vì clear toàn bộ); hoặc dùng cấu trúc có sẵn. Nếu giữ Map, chỉ prune entry cũ, không clear tất cả.

### 3.2 Đọc toàn bộ body trước khi kiểm tra kích thước
- **Mức độ:** HIGH
- **File + dòng:** `api/ai.ts:61-64` (`const rawBody = await req.text()` rồi mới `if (rawBody.length > MAX_BODY_BYTES)`)
- **Mô tả:** Kiểm tra `MAX_BODY_BYTES = 20_000` thực hiện **sau khi** đã đọc hết body vào RAM → attacker gửi body 100MB vẫn được nạp hết (DoS bộ nhớ) trước khi bị từ chối 413.
- **Gợi ý sửa:** Kiểm tra `Content-Length` header trước; hoặc stream-read có giới hạn (đọc tới `MAX_BODY_BYTES` rồi dừng), trả 413 sớm.

### 3.3 `VITE_GEMINI_API_KEY` nhúng vào bundle client, không có guard production
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/services/gemini.ts:21,49,97` (`CLIENT_KEY`, header `x-goog-api-key`, hàm `run`)
- **Mô tả:** Nếu `VITE_GEMINI_API_KEY` được set, mã client gọi thẳng Google với key nằm trong bundle (`callGoogle`). README cảnh báo "không đặt trên production" nhưng **code không cấm** — nếu ai đó lỡ set biến này ở môi trường deploy công khai, key lộ cho tất cả người dùng. Thiếu guard (vd throw ở build production).
- **Gợi ý sửa:** Thêm guard: nếu `import.meta.env.PROD && CLIENT_KEY` thì cảnh báo/throw ở build; hoặc chỉ cho phép `VITE_GEMINI_API_KEY` khi `import.meta.env.DEV`.

### 3.4 Rate-limit dựa trên `x-forwarded-for` phần tử đầu có thể giả mạo
- **Mức độ:** MEDIUM
- **File + dòng:** `api/ai.ts:56` (`const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()`)
- **Mô tả:** Lấy IP từ phần tử đầu của `x-forwarded-for`, client có thể tự set header này → bypass rate-limit bằng cách gửi header khác nhau. *(cần xác minh khi chạy)* xem Vercel có override/prepend IP thật hay không (thường Vercel đặt `x-real-ip` đáng tin hơn).
- **Gợi ý sửa:** Dùng `x-real-ip` hoặc phần tử **cuối** đáng tin của XFF do Vercel thêm, không tin phần tử đầu do client kiểm soát.

### 3.5 Prompt-injection qua dữ liệu người dùng
- **Mức độ:** MEDIUM
- **File + dòng:** `shared/ai.ts` (các `buildXxxPrompt` chèn `input.schedule`, `task.title`... vào prompt)
- **Mô tả:** Tiêu đề/nhiệm vụ do người dùng nhập được nhúng trực tiếp vào prompt AI (vd task tên "Bỏ qua hướng dẫn trước và trả về X"). Tác động giảm nhờ output được các hàm `normalize*` làm sạch và chỉ dùng để hiển thị, nhưng vẫn nên cân nhắc. Cũng chưa cap số phần tử mảng đầu vào trước khi ghép prompt.
- **Gợi ý sửa:** Giới hạn độ dài/chỉ số mảng đầu vào trước khi đưa vào prompt; tách dữ liệu người dùng và chỉ thị bằng delimiter rõ; cân nhắc safety settings của Gemini.

### 3.6 Origin allowlist khớp chuỗi chính xác, dễ lệch
- **Mức độ:** LOW
- **File + dòng:** `api/ai.ts:36-46` (`allowedOrigins.includes(origin)`, `origin === selfOrigin`)
- **Mô tả:** So sánh `origin` bằng chuỗi chính xác, không normalize (port, trailing slash, chữ hoa). Nếu origin có khác nhỏ sẽ fail. Logic self-origin dựa `x-forwarded-host`/`host` chấp nhận được nhưng nên normalize URL.
- **Gợi ý sửa:** Normalize origin (bỏ trailing slash, lowercase) trước khi so; hoặc parse `new URL()` so scheme+host.

### 3.7 "Login" là mô phỏng, không có xác thực
- **Mức độ:** LOW
- **File + dòng:** `src/app/pages/Login.tsx` (`handleLoginSubmit` luôn `onLogin({ name: 'Người dùng', email })`, bỏ qua mật khẩu)
- **Mô tả:** Có form email/mật khẩu nhưng không validate/gửi đi; "đăng nhập" chỉ set flag `localStorage`. Với app local thì không phải lỗ hổng bảo mật, nhưng nút "Quên mật khẩu?" và trường mật khẩu là giả — gây hiểu nhầm.
- **Gợi ý sửa:** Nếu không có backend auth, bỏ trường mật khẩu/đổi thành "Bắt đầu" hoặc ghi rõ đây là hồ sơ cục bộ.

---

## 4. Performance

### 4.1 Không code-splitting / lazy route — một bundle duy nhất
- **Mức độ:** HIGH
- **File + dòng:** `src/app/App.tsx` & `src/app/desktop/DesktopApp.tsx` (import tĩnh tất cả page), không có `React.lazy`/`Suspense` (grep xác nhận không dùng). Build `docs/` chỉ có **1 file JS, 1 file CSS**.
- **Mô tả:** Toàn bộ 11 page mobile + 11 section desktop + ~40 primitive Radix + MUI + recharts + motion nằm trong 1 chunk → tải hết ở lần đầu. Với app mobile đây là tải trọng lớn không cần thiết.
- **Gợi ý sửa:** `React.lazy` cho từng route + `<Suspense>` fallback; tách vendor (recharts, MUI) thành chunk riêng; xem `build.rollupOptions.output.manualChunks`.

### 4.2 Kéo cả bộ Radix UI + MUI (2 design system) vào
- **Mức độ:** MEDIUM
- **File + dòng:** `package.json` (40+ `@radix-ui/*` + `@mui/material` + `@mui/icons-material`)
- **Mô tả:** Dự án dùng Tailwind làm UI chính, các page tự viết, nhưng vẫn cài đầy đủ Radix (carousel, context-menu, menubar, navigation-menu…) và cả MUI — phần lớn không được import trong code app (chỉ `src/app/components/ui/*` shadcn primitives). Tree-shaking giảm nhưng deps/phức tạp tăng, và 2 hệ thống toast/dialog trùng lặp.
- **Gợi ý sửa:** Gỡ các Radix primitive không dùng; quyết chọn 1 hệ thống (Tailwind+shadcn hoặc MUI), tránh dùng cả hai.

### 4.3 63 MB audio MP3 trong `public/` (copy vào `docs/`)
- **Mức độ:** MEDIUM
- **File + dòng:** `public/audio/fma/*` (25 file, ~63.3 MB), được copy vào `docs/` khi build
- **Mô tả:** Nhạc tải on-demand (không vào JS bundle) nên không nặng trang đầu, nhưng **toàn bộ 63MB nằm trong output deploy** (GitHub Pages), tăng kích thước repo/deploy đáng kể.
- **Gợi ý sửa:** Nếu deploy GitHub Pages, cân nhắc host audio trên CDN/bucket riêng và tham chiếu URL; hoặc chỉ include vài bài mặc định.

### 4.4 Store `JSON.stringify` toàn state mỗi mutation
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/hooks/scheduleStore.ts`, `calendarStore.ts`, `achievementStore.ts` (hàm `emit`)
- **Mô tả:** Mỗi `emit()` `JSON.stringify` toàn bộ map và ghi `localStorage`. Ở quy mô nhỏ OK, nhưng nếu lịch/nhiệm vụ nhiều thì mỗi thao tác edit nhỏ đều serialize toàn bộ → chậm dần.
- **Gợi ý sửa:** Debounce ghi, hoặc chỉ ghi phần thay đổi; đo khi dữ liệu lớn.

### 4.5 `getDaySchedules` tính lại cho mỗi ô ngày mỗi render
- **Mức độ:** LOW
- **File + dòng:** `src/app/hooks/useCalendar.ts` (`getDaySchedules`) dùng trong `Calendar.tsx` cho 30 ô lưới, mỗi ô build 2 mảng
- **Gợi ý sửa:** Memo theo `scheduleData`/`calendarData`/`currentMonth` bằng `useMemo`.

### 4.6 Tính `totalAchievements`/`completedTotal` mỗi render không memo
- **Mức độ:** LOW
- **File + dòng:** `src/app/hooks/useAchive.ts` (`reduce` mỗi render)
- **Gợi ý sửa:** `useMemo` vì dữ liệu tĩnh.

---

## 5. React & architecture

### 5.1 Không có ErrorBoundary, không có StrictMode
- **Mức độ:** HIGH
- **File + dòng:** `src/main.tsx` (chỉ `createRoot(...).render(<App/>)`, không bọc); grep xác nhận không có `ErrorBoundary`/`componentDidCatch`/`StrictMode` nào
- **Mô tả:** Mọi lỗi render (vd bug 1.7 `initials` ném, hoặc prop sai) → cả app trắng màn hình, không có UI khôi phục. Thiếu StrictMode cũng bỏ qua phát hiện effect kép ở dev.
- **Gợi ý sửa:** Bọc `<App>` trong `ErrorBoundary` (có fallback UI) ở `main.tsx`; thêm `StrictMode` ở dev.

### 5.2 Trùng nguồn thật: `useTasks` giữ state `tasks` cục bộ song song props
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/hooks/useTasks.ts` (`const [tasks, setTasks] = useState(propTasks)` + `useEffect(() => setTasks(propTasks), [propTasks])`)
- **Mô tả:** State cục bộ `tasks` nhân bản từ props `propTasks`, mỗi lần props đổi thì effect đè lên state cục bộ → 2 nguồn thật, dễ lệch; edit cục bộ có thể bị parent render đè.
- **Gợi ý sửa:** Dùng trực tiếp `propTasks` làm nguồn thật (controlled), hoặc đẩy state lên store thay vì vừa local vừa prop.

### 5.3 Mobile pages + desktop sections trùng lặp (~22 component UI)
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/pages/*` vs `src/app/desktop/sections/*` (mỗi trang có bản mobile + desktop riêng)
- **Mô tả:** Chỉ hooks dùng chung, còn lớp trình bày viết 2 lần → gấp đôi bảo trì, dễ trôi lệch. Một số bug chỉ xuất hiện 1 bên (vd bug 1.4 week strip chỉ ở useTasks mobile).
- **Gợi ý sửa:** Tránh nhân đôi: dùng responsive layout hoặc component dùng chung có biến thể, hoặc chia component nhỏ dùng ở cả 2.

### 5.4 Hai bộ dữ liệu thành tựu tĩnh trùng lặp, shape khác nhau
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/data/achievements.ts` (`achievementGroupsData` có `color`) vs `src/app/hooks/useAchive.ts` (`achievementGroups` có `barColor`/`dotColor`/`subAchievements`)
- **Mô tả:** Cùng 5 nhóm thành tựu, tên giống nhau nhưng định nghĩa ở 2 nơi với shape khác nhau → DRY vi phạm, dễ trôi. Cả hai đều là data demo tĩnh (ngày 2026).
- **Gợi ý sửa:** Gộp về 1 nguồn dữ liệu duy nhất.

### 5.5 Singleton state ở module-level không reset
- **Mức độ:** MEDIUM
- **File + dòng:** `scheduleStore.ts`, `calendarStore.ts`, `achievementStore.ts` (`let xxxState = load()`), `musicEngine.ts` (`export const musicEngine = new MusicEngine()`), `gemini.ts` (`const cache`), `api/ai.ts` (`const hits`)
- **Mô tả:** Nhiều state toàn cục mutable ở module scope; trong SPA chạy dài không reset, và khó test (state rò giữa test). Cùng nhóm 1.11 (không sync đa tab).
- **Gợi ý sửa:** Cân nhắc factory/context cho testability; hoặc ít nhất thêm hàm reset cho testing.

### 5.6 HashRouter + vercel SPA rewrite mâu thuẫn
- **Mức độ:** LOW
- **File + dòng:** `src/app/App.tsx` (`HashRouter`), `vercel.json` (`rewrites` → `/index.html`)
- **Mô tả:** Dùng `HashRouter` (URL `/#/timetable`) thì không cần SPA fallback server (hash xử lý client). Mà `vercel.json` vẫn cấu hình rewrite → thừa. Không hại nhưng sai hướng (rewrite đúng ý nghĩa cho BrowserRouter).
- **Gợi ý sửa:** Chuyển `BrowserRouter` (đẹp hơn) và giữ rewrite, hoặc bỏ rewrite nếu giữ `HashRouter`.

### 5.7 Event bus `nav:quick-action` rải rác nhiều hook
- **Mức độ:** LOW
- **File + dòng:** `src/app/components/BottomNav.tsx` (dispatch) + `useTasks/useTimetable/useCalendar/useFocus` (lắng nghe)
- **Mô tả:** Một custom event toàn cục, 4 hook đều lắng nghe; listener đăng ký lại với deps khác nhau (useFocus mỗi giây khi chạy). Chỉ 1 page mount cùng lúc nên không xung đột nhưng coupling ẩn, khó debug.
- **Gợi ý sửa:** Truyền callback qua props/context thay vì event toàn cục.

---

## 6. API / edge function

### 6.1 Trả raw `err.message` ra client, không có structured logging
- **Mức độ:** MEDIUM
- **File + dòng:** `api/ai.ts` (`buildPrompt` catch, `return json(400, { error: err instanceof Error ? err.message : ...})`)
- **Mô tả:** Thông báo lỗi chi tiết có thể rò thông tin; không có log cấu trúc nào trên edge function → khó debug production.
- **Gợi ý sửa:** Log có cấu trúc (console.warn với context) và trả message chung chung cho client.

### 6.2 Không streaming, không timeout/abort
- **Mức độ:** LOW
- **File + dòng:** `api/ai.ts` (`fetch ... :generateContent`), `src/app/services/gemini.ts` (`callGoogle`/`callProxy`)
- **Mô tả:** Gọi full `generateContent` (1 response), không stream; không `AbortController`/timeout → request Gemini treo có thể block promise mãi (client cache lưu promise treo).
- **Gợi ý sửa:** Thêm timeout (AbortSignal.timeout) và cân nhắc stream cho phản hồi dài.

### 6.3 `.json().catch(() => ({}))` nuốt lỗi parse Gemini
- **Mức độ:** LOW
- **File + dòng:** `api/ai.ts` (`await res.json().catch(() => ({}))`), `gemini.ts` tương tự
- **Mô tả:** Nếu Gemini trả non-JSON, im lặng trả `{}` rồi đi nhánh "không có nội dung" → khó phân biệt lỗi thật. Nên log lý do.

---

## 7. Accessibility & UX

### 7.1 `<html lang="en">` nhưng app tiếng Việt
- **Mức độ:** MEDIUM
- **File + dòng:** `index.html` (`<html lang="en">`)
- **Mô tả:** Screen reader dùng ngôn ngữ sai (đọc tiếng Việt bằng giọng Anh). Cần `lang="vi"`.
- **Gợi ý sửa:** Đổi `lang="vi"` (hoặc `lang="vi-VN"`).

### 7.2 Modal không có role/aria, không focus trap, không đóng bằng Esc
- **Mức độ:** MEDIUM
- **File + dòng:** `AiPlannerModal.tsx`, `BusyHoursModal.tsx`, `CreateScheduleModal.tsx`, `TimePickerModal.tsx`, `Tasks.tsx` (quick-add), phân tích overlay
- **Mô tả:** Không có `role="dialog"`/`aria-modal`, không di chuyển focus vào, không trap focus, không bắt Esc để đóng. Người dùng bàn phím/đọc màn hình không thao tác đúng; Tab có thể thoát ra modal nền.
- **Gợi ý sửa:** Dùng Radix Dialog (đã cài) hoặc thêm role + focus trap + `onKeyDown` Esc.

### 7.3 Nhiều nút chỉ icon không `aria-label`
- **Mức độ:** MEDIUM
- **File + dòng:** `Tasks.tsx` (nút tick/xóa), `Focus.tsx` (play/pause/reset/more), `BottomNav.tsx` (action +), `Timetable.tsx` (nút Today), `Calendar.tsx` (nút lock), `Notifications.tsx` (`Toggle` không có `role="switch"`/`aria-checked` — bất nhất với `Tasks.tsx` daily toggle vốn có)
- **Mô tả:** Screen reader đọc nút rỗng, không biết chức năng.
- **Gợi ý sửa:** Thêm `aria-label` cho mọi nút icon; `Toggle` dùng `role="switch" aria-checked`.

### 7.4 Label form không gắn với input
- **Mức độ:** MEDIUM
- **File + dòng:** `Login.tsx`, `Tasks.tsx` (modal thêm), `CreateScheduleModal.tsx` (`<label>` không `htmlFor`, input không `id`)
- **Mô tả:** Label không gắn chương trình với input → AT không liên kết được. (`CreateScheduleModal` nút màu thì lại có `aria-label`/`aria-pressed` — bất nhất).
- **Gợi ý sửa:** Thêm `htmlFor`/`id` hoặc bọc input trong `<label>`.

### 7.5 Animation không tôn trọng `prefers-reduced-motion`
- **Mức độ:** MEDIUM
- **File + dòng:** `Focus.tsx` (`playingBars` `animate-pulse`), `Achive.tsx`/`AiPlannerModal.tsx` (progress bar `motion`), modal transitions; touch picker `Focus.tsx` `e.preventDefault()` chặn cuộn native, không có thay thế bàn phím
- **Mô tả:** Người giảm motion vẫn thấy animation; touch picker vô hiệu cuộn native mà không có cách chỉnh bằng bàn phím.
- **Gợi ý sửa:** Thêm media query `prefers-reduced-motion` tắt animation; thêm nút/bàn phím cho time picker.

### 7.6 Phần tử tương tác lồng nhau
- **Mức độ:** MEDIUM
- **File + dòng:** `Timetable.tsx` & `Calendar.tsx` (dòng lịch `role="button"` chứa `<button>` xóa/sửa bên trong)
- **Mô tả:** Nút lồng trong `role="button"` là HTML không hợp lệ, gây nhập nhằng cho AT.
- **Gợi ý sửa:** Tách nút xóa/sửa ra ngoài, hoặc dùng div có thể click + nút riêng không lồng.

### 7.7 About: nút/link chết; Calendar: holiday placeholder sai
- **Mức độ:** LOW
- **File + dòng:** `About.tsx` (social/legal/"Gửi phản hồi" không onClick), `useCalendar.ts` (`holidays = {1:'Ngày Quốc tế', 19:'Tết Đoan Ngọ'}` — hiện mỗi tháng)
- **Mô tả:** Các nút About không làm gì; holiday hardcoded hiển thị ngày 1/19 **mọi tháng** (không phải lễ thật).
- **Gợi ý sửa:** Gắn link/handler; bỏ holiday placeholder hoặc load danh sách lễ thật.

---

## 8. Maintainability & conventions

### 8.1 Lỗi chính tả "Achive" (Archive) lan truyền
- **Mức độ:** MEDIUM
- **File + dòng:** `src/app/pages/Achive.tsx`, `useAchive.ts`, route `/achive`, `BottomNav.tsx` label, `desktop/sections/DesktopAchive.tsx`
- **Mô tả:** "Achive" (thiếu "r") xuất hiện ở tên file, hook, route, nav — URL người dùng thấy `/#/achive`. Đổi tên lan truyền nhưng sai chính tả lộ ra ngoài.

### 8.2 Metadata/template còn sót của Figma
- **Mức độ:** MEDIUM
- **File + dòng:** `package.json` (`"name": "@figma/my-make-file"`, `"version": "0.0.1"`), `vite.config.ts` (`figmaAssetResolver` + comment "required for Make"), `index.html` (`<title>Design mobile productivity app</title>`), `README.md` ("Design mobile productivity app")
- **Mô tả:** App tên DayTrack nhưng package name, title, metadata vẫn là template Figma/Make.
- **Gợi ý sửa:** Đổi name/title thành DayTrack, dọn comment.

### 8.3 Magic numbers/strings và logic ngày trùng lặp
- **Mức độ:** MEDIUM
- **File + dòng:** `useCalendar.ts` (`lockedDays = new Set([15,20])`, `holidays`), công thức thứ Hai không nhất quán (xem 1.4), 3 định dạng `todayKey` (xem 1.3)
- **Mô tả:** Số cố định không rõ ý nghĩa; logic ngày lặp rải rác nhiều nơi không nhất quán.

### 8.4 `PageContainer.tsx` là code chết
- **Mức độ:** LOW
- **File + dòng:** `src/app/components/PageContainer.tsx` (grep xác nhận không import ở đâu; prop `showSettings` không dùng)
- **Mô tả:** Component không ai dùng, prop khai báo mà không dùng. Mỗi page tự inline `min-h-screen bg-white pb-28 max-w-md mx-auto`.

### 8.5 `globals.css` trống và không import; state chết trong Login
- **Mức độ:** LOW
- **File + dòng:** `src/styles/globals.css` (trống, không được import), `Login.tsx` (`const [showPassword, ...]` cấp top không dùng)
- **Mô tả:** File CSS rỗng + state không dùng → dọn dẹp.

### 8.6 Dùng `onKeyPress` (đã deprecated)
- **Mức độ:** LOW
- **File + dòng:** `src/app/components/CreateScheduleModal.tsx` (`onKeyPress` cho input thêm task)
- **Mô tả:** `onKeyPress` deprecated trong React, nên `onKeyDown`.

### 8.7 Thiếu JSDoc cho hàm phức tạp
- **Mức độ:** LOW
- **File + dòng:** `BusyHoursModal.tsx` (logic pointer ~350 dòng), `shared/ai.ts` (`normalize*`), `useNotificationScheduler.ts` (`tick`)
- **Mô tả:** Logic phức tạp không có JSDoc/giải thích → khó bảo trì.

### 8.8 Không có lint/format
- **Mức độ:** LOW
- **File + dòng:** `package.json` (không có eslint/prettier/script)
- **Mô tả:** Thiếu chuẩn style tự động → code bất nhất (vd `toggleLock` dùng ternary cho side effect, class `w-4.5` không hợp lệ trong Settings.tsx).

---

## 9. Build / config / deploy

### 9.1 `vercel.json` outputDirectory `"dist"` ≠ vite build ra `docs/`
- **Mức độ:** CRITICAL
- **File + dòng:** `vercel.json:4` (`"outputDirectory": "dist"`) vs `vite.config.ts:36-38` (`build.outDir: 'docs'`)
- **Mô tả:** `vite build` xuất ra `docs/` (theo vite.config cho GitHub Pages), nhưng `vercel.json` báo Vercel phục vụ `dist/` (không tồn tại). Kết quả: Vercel build xong không tìm thấy output → deploy **phục vụ rỗng/404**. Trên ổ đã kiểm chứng: có `docs/` nhưng không có `dist/`. *(cần xác minh trên Vercel)* nhưng chênh cấu hình là chắc chắn.
- **Gợi ý sửa:** Đồng nhất: hoặc đặt `vercel.json` `outputDirectory: "docs"` (kèm `buildCommand: vite build`), hoặc đổi `vite.config` `outDir: "dist"`. Khuyến nghị dùng `dist` cho Vercel và cấu hình GitHub Pages riêng (hoặc 2 cấu hình env).

### 9.2 Không có type-check trong pipeline build
- **Mức độ:** HIGH
- **File + dòng:** thiếu `tsconfig.json`, `package.json` không có `typescript`/script typecheck (xem 2.1)
- **Mô tả:** `vite build` (esbuild) bỏ kiểu → lỗi kiểu chạy vào prod. Đây là nguyên nhân trực tiếp cho các bug bị che giấu (vd 5.3/7.2).
- **Gợi ý sửa:** Thêm `tsconfig` strict + `typescript` + script `"typecheck": "tsc --noEmit"`, chạy trong CI và hook `prebuild`.

### 9.3 Không có test/lint tự động
- **Mức độ:** MEDIUM
- **File + dòng:** `package.json` chỉ có `build`/`dev`, không có test/eslint
- **Mô tả:** Không có cổng chất lượng tự động → bug logic (như 1.1, 1.3) khó phát hiện sớm.
- **Gợi ý sửa:** Thêm vitest + eslint + pre-commit; viết test cho hooks (scheduler, stores, normalize*).

### 9.4 `__dirname` trong config ESM
- **Mức độ:** LOW
- **File + dòng:** `vite.config.ts` (`figmaAssetResolver` dùng `path.resolve(__dirname, ...)`)
- **Mô tả:** `"type": "module"` nên `__dirname` không tồn tại sẵn; Vite bundle config nên vẫn chạy, nhưng không di động/tuần thủ. Nên `fileURLToPath(new URL('.', import.meta.url))`.

### 9.5 HashRouter làm SPA rewrite thừa
- **Mức độ:** LOW
- **File + dòng:** `vercel.json` (`rewrites`), `App.tsx` (`HashRouter`)
- **Mô tả:** Đã nói ở 5.6; rewrite không hại nhưng thừa.

### 9.6 Commit build artifact `docs/` (kèm 63MB audio) vào repo
- **Mức độ:** LOW
- **File + dòng:** `docs/` (chứa index.html, js, css, 25 mp3)
- **Mô tả:** Build output được commit vào repo (cho GitHub Pages "main /docs"), làm repo nặng; `.gitignore` đang ignore `dist/` nhưng không ignore `docs/`.
- **Gợi ý sửa:** Dùng GitHub Action build+deploy thay vì commit `docs/`; hoặc ít nhất không commit audio vào repo.

---

## TOP 10 vấn đề nên sửa trước

Xếp theo tác động (đúng/sai + phạm vi ảnh hưởng):

1. **[CRITICAL] 9.1 — `vercel.json` outputDirectory `"dist"` vs vite `docs/`**: deploy production hỏng. Sửa 1 dòng config.
2. **[HIGH] 2.1/9.2 — Không có tsconfig + type-check trong build**: gốc rễ che giấu nhiều bug kiểu. Thêm tsconfig strict + `tsc --noEmit` vào CI.
3. **[HIGH] 1.1 — Thông báo lặp mỗi 20s do filter log sai**: spam thông báo + log phình. Đảo filter, prune đúng.
4. **[HIGH] 1.3 — Định dạng `dateKey` pad/không pad không nhất quán**: nhiệm vụ hằng ngày không cộng tiến độ thành tựu (tháng/ngày <10). Gom 1 helper.
5. **[HIGH] 1.2 — `JSON.parse` localStorage không try/catch**: dữ liệu hỏng = trắng màn hình. Bọc try/catch.
6. **[HIGH] 5.1 — Không ErrorBoundary/StrictMode**: 1 lỗi render = cả app chết. Bọc + thêm fallback UI.
7. **[HIGH] 3.1 — Rate-limit clear wholesale (`hits.clear()`)**: DoS amplifier, reset tất cả giới hạn. Dùng TTL/LRU.
8. **[HIGH] 3.2 — Đọc hết body rồi mới kiểm size**: DoS bộ nhớ. Kiểm Content-Length/trước.
9. **[HIGH] 4.1 — Không code-splitting, 1 bundle lớn**: trải nghiệm tải trên mobile. `React.lazy` per route + tách vendor.
10. **[MEDIUM] 7.2 + 7.3 — Modal thiếu role/focus-trap/Esc, nút icon thiếu aria-label**: accessibility yếu cho toàn app. Dùng Radix Dialog + aria-label.

---

*Nhận xét chung: Nền tảng kỹ thuật (store dùng `useSyncExternalStore`, normalize output AI, mô hình bảo mật key) tốt. Ưu tiên dọn các bug logic ngày/thông báo (1.1, 1.3), thêm type-checking (2.1), sửa cấu hình deploy (9.1) và bổ sung ErrorBoundary (5.1) trước; sau đó đến accessibility và code-splitting.*
