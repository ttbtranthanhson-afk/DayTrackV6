import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Trash2, Check, Camera, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  userName: string;
  onSaveAvatar: (avatarUrl: string | undefined) => void;
}

// Bộ sưu tập avatar mẫu tạo bằng SVG Data URL chất lượng cao
export const PRESET_AVATARS: Array<{ id: string; name: string; url: string }> = [
  {
    id: 'student-blue',
    name: 'Sinh viên năng động',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3B82F6"/>
            <stop offset="100%" stop-color="#1D4ED8"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <circle cx="50" cy="40" r="20" fill="#FDE047"/>
        <path d="M25 85 C25 65 35 55 50 55 C65 55 75 65 75 85 Z" fill="#FFFFFF"/>
        <circle cx="43" cy="38" r="3" fill="#1E293B"/>
        <circle cx="57" cy="38" r="3" fill="#1E293B"/>
        <path d="M45 46 Q50 50 55 46" stroke="#1E293B" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M30 25 L50 15 L70 25 L50 32 Z" fill="#1E293B"/>
      </svg>
    `)}`,
  },
  {
    id: 'focus-purple',
    name: 'Tập trung sâu',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8B5CF6"/>
            <stop offset="100%" stop-color="#6D28D9"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <circle cx="50" cy="42" r="18" fill="#FED7AA"/>
        <path d="M26 86 C26 68 36 60 50 60 C64 60 74 68 74 86 Z" fill="#F1F5F9"/>
        <!-- Headphone -->
        <path d="M30 42 A20 20 0 0 1 70 42" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round"/>
        <rect x="26" y="36" width="7" height="14" rx="3.5" fill="#FFFFFF"/>
        <rect x="67" y="36" width="7" height="14" rx="3.5" fill="#FFFFFF"/>
        <circle cx="44" cy="42" r="2.5" fill="#334155"/>
        <circle cx="56" cy="42" r="2.5" fill="#334155"/>
        <path d="M46 48 Q50 51 54 48" stroke="#334155" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)}`,
  },
  {
    id: 'creative-pink',
    name: 'Sáng tạo & Nghệ thuật',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EC4899"/>
            <stop offset="100%" stop-color="#BE185D"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <circle cx="50" cy="40" r="19" fill="#FBCFE8"/>
        <path d="M26 86 C26 66 36 58 50 58 C64 58 74 66 74 86 Z" fill="#FFFFFF"/>
        <!-- Glasses -->
        <rect x="36" y="36" width="11" height="9" rx="3" fill="none" stroke="#831843" stroke-width="2"/>
        <rect x="53" y="36" width="11" height="9" rx="3" fill="none" stroke="#831843" stroke-width="2"/>
        <line x1="47" y1="40" x2="53" y2="40" stroke="#831843" stroke-width="2"/>
        <path d="M46 48 Q50 52 54 48" stroke="#831843" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="68" cy="24" r="5" fill="#FDE047"/>
      </svg>
    `)}`,
  },
  {
    id: 'champion-orange',
    name: 'Chiến binh kiên trì',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F97316"/>
            <stop offset="100%" stop-color="#C2410C"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <circle cx="50" cy="40" r="18" fill="#FFEDD5"/>
        <path d="M26 86 C26 66 36 58 50 58 C64 58 74 66 74 86 Z" fill="#FFFFFF"/>
        <path d="M30 33 Q50 20 70 33" stroke="#DC2626" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="43" cy="40" r="2.5" fill="#431407"/>
        <circle cx="57" cy="40" r="2.5" fill="#431407"/>
        <path d="M45 47 Q50 51 55 47" stroke="#431407" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    `)}`,
  },
  {
    id: 'zen-green',
    name: 'Thư giãn & Cân bằng',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10B981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <circle cx="50" cy="42" r="19" fill="#D1FAE5"/>
        <path d="M26 86 C26 66 36 60 50 60 C64 60 74 66 74 86 Z" fill="#FFFFFF"/>
        <path d="M38 41 Q43 38 48 41" stroke="#065F46" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M52 41 Q57 38 62 41" stroke="#065F46" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M46 48 Q50 52 54 48" stroke="#065F46" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Small leaf -->
        <path d="M50 20 C42 16 45 28 50 24 C55 28 58 16 50 20 Z" fill="#A7F3D0"/>
      </svg>
    `)}`,
  },
  {
    id: 'cat-yellow',
    name: 'Mèo chăm chỉ',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EAB308"/>
            <stop offset="100%" stop-color="#CA8A04"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <path d="M30 35 L40 45 L25 48 Z" fill="#FFFFFF"/>
        <path d="M70 35 L60 45 L75 48 Z" fill="#FFFFFF"/>
        <circle cx="50" cy="48" r="22" fill="#FFFFFF"/>
        <circle cx="42" cy="46" r="3" fill="#854D0E"/>
        <circle cx="58" cy="46" r="3" fill="#854D0E"/>
        <polygon points="50,51 47,54 53,54" fill="#F43F5E"/>
        <path d="M46 56 Q50 59 54 56" stroke="#854D0E" stroke-width="2" fill="none" stroke-linecap="round"/>
        <line x1="33" y1="49" x2="25" y2="47" stroke="#A16207" stroke-width="1.5"/>
        <line x1="33" y1="52" x2="25" y2="53" stroke="#A16207" stroke-width="1.5"/>
        <line x1="67" y1="49" x2="75" y2="47" stroke="#A16207" stroke-width="1.5"/>
        <line x1="67" y1="52" x2="75" y2="53" stroke="#A16207" stroke-width="1.5"/>
      </svg>
    `)}`,
  },
  {
    id: 'coder-dark',
    name: 'Lập trình viên Pro',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E293B"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <circle cx="50" cy="42" r="18" fill="#F8FAFC"/>
        <path d="M26 86 C26 66 36 60 50 60 C64 60 74 66 74 86 Z" fill="#0284C7"/>
        <path d="M38 38 L43 42 L38 46" stroke="#0EA5E9" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M62 38 L57 42 L62 46" stroke="#0EA5E9" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="48" y1="46" x2="52" y2="38" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
        <rect x="42" y="52" width="16" height="3" rx="1.5" fill="#38BDF8"/>
      </svg>
    `)}`,
  },
  {
    id: 'star-teal',
    name: 'Ngôi sao tỏa sáng',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0D9488"/>
            <stop offset="100%" stop-color="#115E59"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="30" fill="url(#bg)"/>
        <circle cx="50" cy="40" r="19" fill="#CCFBF1"/>
        <path d="M26 86 C26 66 36 58 50 58 C64 58 74 66 74 86 Z" fill="#FFFFFF"/>
        <circle cx="43" cy="38" r="3" fill="#134E4A"/>
        <circle cx="57" cy="38" r="3" fill="#134E4A"/>
        <path d="M46 47 Q50 51 54 47" stroke="#134E4A" stroke-width="2" fill="none" stroke-linecap="round"/>
        <!-- Star badge -->
        <polygon points="50,15 53,23 61,23 55,28 57,36 50,31 43,36 45,28 39,23 47,23" fill="#FACC15"/>
      </svg>
    `)}`,
  },
];

export function AvatarModal({
  isOpen,
  onClose,
  currentAvatar,
  userName,
  onSaveAvatar,
}: AvatarModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(currentAvatar);
  const [previewCustom, setPreviewCustom] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = userName
    ? userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'DT';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn một tập tin hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Nén và resize ảnh về kích thước chuẩn 256x256 để không làm đầy localStorage
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Cắt vuông từ tâm
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewCustom(compressed);
          setSelectedAvatar(compressed);
          toast.success('Đã tải ảnh lên! Nhấn "Lưu ảnh" để hoàn tất.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveAvatar(selectedAvatar);
    toast.success('Đã cập nhật ảnh đại diện!');
    onClose();
  };

  const handleRemove = () => {
    setSelectedAvatar(undefined);
    setPreviewCustom(null);
    onSaveAvatar(undefined);
    toast.success('Đã gỡ ảnh đại diện, trở về chữ cái mặc định.');
    onClose();
  };

  const activeAvatar = selectedAvatar || currentAvatar;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
            onClick={onClose}
          />

          {/* Modal Card */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Đổi ảnh đại diện</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Tải ảnh của bạn hoặc chọn avatar có sẵn</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Current / Preview Avatar display */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                      {activeAvatar ? (
                        <img
                          src={activeAvatar}
                          alt={userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-1 right-1 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md flex items-center justify-center transition-transform active:scale-95 border-2 border-white"
                      title="Chọn ảnh từ thiết bị"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 font-medium">
                    {userName}
                  </p>
                </div>

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-blue-100"
                  >
                    <Upload className="w-4 h-4" />
                    Tải ảnh từ máy
                  </button>

                  {activeAvatar && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-100"
                      title="Gỡ ảnh đại diện"
                    >
                      <Trash2 className="w-4 h-4" />
                      Gỡ ảnh
                    </button>
                  )}
                </div>

                {/* Preset Avatars */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Hoặc chọn Avatar có sẵn
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {PRESET_AVATARS.map(avatar => {
                      const isSelected = selectedAvatar === avatar.url;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(avatar.url);
                          }}
                          className={`relative aspect-square rounded-2xl p-1 transition-all group overflow-hidden ${
                            isSelected
                              ? 'ring-4 ring-blue-500 scale-105 shadow-md'
                              : 'hover:scale-102 hover:ring-2 hover:ring-gray-300'
                          }`}
                          title={avatar.name}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-600/30 rounded-xl flex items-center justify-center">
                              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-purple-200 hover:shadow-xl transition-all"
                >
                  Lưu ảnh
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
