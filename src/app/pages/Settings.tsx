import { useState } from 'react';
import { ChevronRight, User, Bell, Palette, Info, LogOut, Calendar, Briefcase, Target, Mail, Camera, MessageSquare, BarChart2 } from 'lucide-react';
import { LogoMini } from '../components/Logo';
import { useNavigate } from 'react-router';
import { AvatarModal } from '../components/AvatarModal';
import { FeedbackModal } from '../components/FeedbackModal';
import type { UserData } from '../hooks/accountStore';

interface SettingsProps {
  userData: UserData;
  onLogout: () => void;
  onUpdateUserData?: (data: Partial<UserData>) => void;
}

const settingsGroups = [
  {
    title: 'Tài khoản',
    items: [
      { icon: User, label: 'Hồ sơ cá nhân', sub: 'Chỉnh sửa thông tin', color: 'bg-blue-500', path: '/profile' },
    ],
  },
  {
    title: 'Ứng dụng',
    items: [
      { icon: Bell, label: 'Thông báo', sub: 'Nhắc nhở & cảnh báo', color: 'bg-purple-500', path: '/notifications' },
      { icon: Palette, label: 'Giao diện', sub: 'Màu sắc & font chữ', color: 'bg-pink-500', path: '/appearance' },
    ],
  },
  {
    title: 'Thông tin',
    items: [
      { icon: Info, label: 'Giới thiệu', sub: 'Về DayTrack v1.0', color: 'bg-orange-500', path: '/about' },
    ],
  },
];

export function Settings({ userData, onLogout, onUpdateUserData }: SettingsProps) {
  const navigate = useNavigate();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const isDeveloper = !!userData.isDeveloper;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const initials = userData.name
    ? userData.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'DT';

  const handleSaveAvatar = (newAvatarUrl: string | undefined) => {
    onUpdateUserData?.({ avatar: newAvatarUrl });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="px-5 pt-12 pb-4 bg-gray-50">
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
        </div>

        {/* Profile Card */}
        <div className="mx-5 mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-5 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute bottom-0 right-8 w-16 h-16 bg-white/10 rounded-full" />

          <div className="flex items-center gap-4 relative z-10">
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="relative w-16 h-16 rounded-2xl bg-white/20 hover:ring-2 hover:ring-white/80 transition-all flex items-center justify-center text-2xl font-bold flex-shrink-0 group overflow-hidden shadow-md cursor-pointer"
              title="Nhấn để đổi ảnh đại diện"
            >
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials || <LogoMini size={32} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-5 h-5" />
              </div>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold truncate">{userData.name}</h2>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="text-[11px] font-semibold bg-white/25 hover:bg-white/35 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  Đổi ảnh
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-white/60" />
                <p className="text-sm text-white/70 truncate">{userData.email}</p>
              </div>
            </div>
          </div>

          {(userData.age || userData.job) && (
            <div className="flex gap-2 mt-4 relative z-10 flex-wrap">
              {userData.age && (
                <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {userData.age} tuổi
                </span>
              )}
              {userData.job && (
                <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {userData.job}
                </span>
              )}
              {userData.goals && (
                <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Có mục tiêu
                </span>
              )}
            </div>
          )}
        </div>

        {/* Settings groups */}
        <div className="px-5 space-y-5">
          {settingsGroups.map(group => (
            <div key={group.title}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {group.title}
              </p>
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
                {group.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-bold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Mục nhà phát triển — chỉ hiện khi đăng nhập tài khoản dev */}
          {isDeveloper && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Nhà phát triển
              </p>
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
                <button
                  onClick={() => navigate('/dev/feedbacks')}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <BarChart2 className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-800">Phản hồi người dùng</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tổng hợp & đọc phản hồi</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>
          )}

          {/* Logout */}
          <div>
            <div className="bg-white rounded-2xl overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-rose-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-[18px] h-[18px] text-white" />
                </div>
                <span className="flex-1 text-left text-sm font-bold text-rose-600">Đăng xuất</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 pb-2 font-medium">DayTrack v1.0.0</p>
        </div>
      </div>

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={userData.avatar}
        userName={userData.name}
        onSaveAvatar={handleSaveAvatar}
      />

      {/* Nút phản hồi nổi — ẩn với tài khoản dev */}
      {!isDeveloper && (
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="fixed bottom-24 right-5 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
          title="Gửi phản hồi"
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </button>
      )}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        userData={userData}
      />
    </div>
  );
}
