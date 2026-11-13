/**
 * Các tiện ích ngày tháng dùng chung cho toàn ứng dụng.
 *
 * Trước đây có 3 format dateKey không nhất quán:
 *   - `useTasks.ts`: `${year}-${month+1}-${date}` → không zero-pad → "2024-1-5"
 *   - `achievementStore.ts`: zero-pad → "2024-01-05"
 *   - `useNotificationScheduler.ts`: không zero-pad
 * → nhiệm vụ hằng ngày hoàn thành không được tính vào tiến độ thành tựu
 *   khi tháng hoặc ngày < 10.
 *
 * Giải pháp: MỌI nơi dùng `formatDateKey(date)` từ file này.
 */

/**
 * Trả về date key dạng "YYYY-MM-DD" (zero-padded) cho ngày đã cho.
 * Dùng cho: tasks.completedDate, achievementStore.todayKey, calendarStore.dateKey,
 *           useNotificationScheduler.todayKey.
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Trả về date key của ngày hôm nay.
 */
export function todayDateKey(): string {
  return formatDateKey(new Date());
}

/**
 * Tính weekday index theo Monday-first (T2=0 … CN=6).
 * Dùng để map task.weekday với ngày hiện tại.
 */
export function mondayFirstWeekday(date: Date): number {
  return date.getDay() === 0 ? 6 : date.getDay() - 1;
}

/**
 * Trả về ngày đầu tuần (Thứ Hai) của tuần chứa `date`.
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const offset = mondayFirstWeekday(d);
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}
