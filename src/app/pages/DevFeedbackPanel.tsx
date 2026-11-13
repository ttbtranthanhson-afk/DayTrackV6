import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Star, Trash2, Filter, TrendingUp, MessageSquare, Users, BarChart2 } from 'lucide-react';
import { getAllFeedbacks, deleteFeedback, getFeedbackStats, type FeedbackEntry } from '../hooks/feedbackStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_LABELS: Record<FeedbackEntry['category'], { label: string; emoji: string; color: string }> = {
  general:     { label: 'Tổng quan',  emoji: '💬', color: 'bg-blue-100 text-blue-700' },
  ui:          { label: 'Giao diện',  emoji: '🎨', color: 'bg-pink-100 text-pink-700' },
  feature:     { label: 'Tính năng', emoji: '✨', color: 'bg-purple-100 text-purple-700' },
  bug:         { label: 'Lỗi',        emoji: '🐛', color: 'bg-red-100 text-red-700' },
  performance: { label: 'Hiệu năng', emoji: '⚡', color: 'bg-amber-100 text-amber-700' },
};

const RATING_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-500'];
const RATING_LABELS = ['', 'Rất tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];

function StarRow({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DevFeedbackPanel() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>(() => getAllFeedbacks());
  const [filterCategory, setFilterCategory] = useState<FeedbackEntry['category'] | 'all'>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(() => getFeedbackStats(feedbacks), [feedbacks]);

  const filtered = useMemo(() => {
    return feedbacks.filter(f => {
      if (filterCategory !== 'all' && f.category !== filterCategory) return false;
      if (filterRating > 0 && f.rating !== filterRating) return false;
      return true;
    });
  }, [feedbacks, filterCategory, filterRating]);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      deleteFeedback(id);
      setFeedbacks(getAllFeedbacks());
      setDeletingId(null);
      toast.success('Đã xoá phản hồi.');
    }, 300);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="px-5 pt-12 pb-4 bg-gray-50 flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phản hồi người dùng</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Chỉ nhà phát triển mới thấy mục này</p>
          </div>
        </div>

        <div className="px-5 space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
              <Users className="w-5 h-5 text-blue-500" />
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-[11px] text-gray-400 font-semibold">Phản hồi</p>
            </div>
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <p className="text-2xl font-bold text-gray-800">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
              </p>
              <p className="text-[11px] text-gray-400 font-semibold">Điểm TB</p>
            </div>
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-2xl font-bold text-gray-800">
                {stats.total > 0
                  ? Math.round(((stats.byRating[4] || 0) + (stats.byRating[5] || 0)) / stats.total * 100)
                  : 0}%
              </p>
              <p className="text-[11px] text-gray-400 font-semibold">Hài lòng</p>
            </div>
          </div>

          {/* Rating breakdown */}
          {stats.total > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-bold text-gray-700">Phân bố đánh giá</p>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <div className="flex gap-0.5 w-20 justify-end">
                      {Array.from({ length: r }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <StarRow count={stats.byRating[r] || 0} max={stats.total} />
                    <span className="text-xs font-semibold text-gray-400 w-6 text-right">
                      {stats.byRating[r] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lọc theo</p>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filterCategory === 'all'
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Tất cả
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key as FeedbackEntry['category'])}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filterCategory === key
                      ? 'bg-gray-800 border-gray-800 text-white'
                      : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {val.emoji} {val.label}
                </button>
              ))}
            </div>

            {/* Rating filter */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setFilterRating(0)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filterRating === 0
                    ? 'bg-gray-800 border-gray-800 text-white'
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Mọi sao
              </button>
              {[5, 4, 3, 2, 1].map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRating(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                    filterRating === r
                      ? 'bg-amber-400 border-amber-400 text-white'
                      : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {r} <Star className="w-3 h-3 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback list */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {filtered.length} phản hồi {filterCategory !== 'all' || filterRating > 0 ? '(đã lọc)' : ''}
            </p>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-400">Chưa có phản hồi nào</p>
                <p className="text-xs text-gray-300 mt-1">
                  {feedbacks.length === 0
                    ? 'Người dùng chưa gửi phản hồi.'
                    : 'Không có kết quả phù hợp với bộ lọc.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filtered.map(fb => {
                    const cat = CATEGORY_LABELS[fb.category];
                    return (
                      <motion.div
                        key={fb.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: deletingId === fb.id ? 0 : 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl p-4 shadow-sm"
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{fb.userName}</p>
                            <p className="text-[11px] text-gray-400 truncate">{fb.userEmail}</p>
                          </div>
                          <button
                            onClick={() => handleDelete(fb.id)}
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors flex-shrink-0"
                            title="Xoá phản hồi"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>

                        {/* Rating + category */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
                            {cat.emoji} {cat.label}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-white ${RATING_COLORS[fb.rating]}`}>
                            {RATING_LABELS[fb.rating]}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-3 py-2">
                          {fb.message}
                        </p>

                        {/* Date */}
                        <p className="text-[11px] text-gray-300 mt-2 text-right">{formatDate(fb.createdAt)}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
