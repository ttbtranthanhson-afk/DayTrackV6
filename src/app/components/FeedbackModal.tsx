import { useState } from 'react';
import { X, Star, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { saveFeedback, type FeedbackEntry } from '../hooks/feedbackStore';
import type { UserData } from '../hooks/accountStore';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
}

const CATEGORIES: { value: FeedbackEntry['category']; label: string; emoji: string }[] = [
  { value: 'general', label: 'Tổng quan', emoji: '💬' },
  { value: 'ui', label: 'Giao diện', emoji: '🎨' },
  { value: 'feature', label: 'Tính năng', emoji: '✨' },
  { value: 'bug', label: 'Lỗi', emoji: '🐛' },
  { value: 'performance', label: 'Hiệu năng', emoji: '⚡' },
];

export function FeedbackModal({ isOpen, onClose, userData }: FeedbackModalProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | 0>(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<FeedbackEntry['category']>('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá.');
      return;
    }
    if (!message.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    saveFeedback({
      userName: userData.name,
      userEmail: userData.email,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      category,
      message: message.trim(),
    });
    setSubmitted(true);
    toast.success('Cảm ơn bạn đã gửi phản hồi!');
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setMessage('');
      setCategory('general');
      onClose();
    }, 1800);
  };

  const displayRating = hoverRating || rating;
  const ratingLabels = ['', 'Rất tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative w-full max-w-md bg-white rounded-t-3xl px-6 pt-5 pb-10 z-10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Gửi phản hồi</h2>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8 gap-3"
                >
                  <div className="text-5xl">🎉</div>
                  <p className="text-lg font-bold text-gray-800">Cảm ơn bạn!</p>
                  <p className="text-sm text-gray-500 text-center">Phản hồi của bạn giúp chúng tôi cải thiện DayTrack.</p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Star rating */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Đánh giá trải nghiệm</p>
                    <div className="flex gap-2 items-center">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s as 1 | 2 | 3 | 4 | 5)}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110 active:scale-95"
                        >
                          <Star
                            className={`w-9 h-9 transition-colors ${s <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                          />
                        </button>
                      ))}
                      {displayRating > 0 && (
                        <span className="text-sm font-semibold text-amber-500 ml-1">
                          {ratingLabels[displayRating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loại phản hồi</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategory(c.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            category === c.value
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {c.emoji} {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nội dung</p>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Chia sẻ cảm nhận của bạn về DayTrack..."
                      className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                      rows={4}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-200 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Gửi phản hồi
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
