export interface FeedbackEntry {
  id: string;
  userName: string;
  userEmail: string;
  rating: 1 | 2 | 3 | 4 | 5;
  category: 'general' | 'bug' | 'feature' | 'ui' | 'performance';
  message: string;
  createdAt: string;
}

const FEEDBACK_KEY = 'daytrack_feedbacks';

export function getAllFeedbacks(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveFeedback(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>): FeedbackEntry {
  const feedbacks = getAllFeedbacks();
  const newEntry: FeedbackEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  };
  feedbacks.unshift(newEntry); // mới nhất lên đầu
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks));
  return newEntry;
}

export function deleteFeedback(id: string): void {
  const feedbacks = getAllFeedbacks().filter(f => f.id !== id);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks));
}

export function getFeedbackStats(feedbacks: FeedbackEntry[]) {
  if (feedbacks.length === 0) {
    return { avgRating: 0, total: 0, byCategory: {}, byRating: {} };
  }

  const avgRating =
    feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;

  const byCategory: Record<string, number> = {};
  const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const f of feedbacks) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    byRating[f.rating] = (byRating[f.rating] || 0) + 1;
  }

  return { avgRating, total: feedbacks.length, byCategory, byRating };
}
