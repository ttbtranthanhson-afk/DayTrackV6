import { useState } from 'react';
import { ChevronRight, User, Bell, Palette, Info, LogOut, Calendar, Briefcase, Target, Mail, Camera } from 'lucide-react';
import { LogoMini } from '../../components/Logo';
import { useNavigate } from 'react-router';
import { DesktopPageHeader } from '../DesktopUI';
import { AvatarModal } from '../../components/AvatarModal';
import type { UserData } from '../../hooks/accountStore';

interface DesktopSettingsProps {
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

export function DesktopSettings({ userData, onLogout, onUpdateUserData }: DesktopSettingsProps) {
  const navigate = useNavigate();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const initials = userData.name
    ? userData.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'DT';

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleSaveAvatar = (newAvatarUrl: string | undefined) => {
    onUpdateUserData?.({ avatar: newAvatarUrl });
  };

  return (
    <div>
      <DesktopPageHeader title="Cài đặt" subtitle="Tùy chỉnh trải nghiệm của bạn" />

      <div className="grid grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="col-span-1">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-white relative overflow-hidden">
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
                    <Calendar className="w-3 h-3" /> {userData.age} tuổi
                  </span>
                )}
                {userData.job && (
                  <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> {userData.job}
                  </span>
                )}
                {userData.goals && (
                  <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Target className="w-3 h-3" /> Có mục tiêu
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center gap-4 px-4 py-4 bg-white rounded-2xl border border-gray-100 hover:bg-rose-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="flex-1 text-left text-sm font-bold text-rose-600">Đăng xuất</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Groups */}
        <div className="col-span-2 space-y-6">
          {settingsGroups.map(group => (
            <div key={group.title}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{group.title}</p>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-[18px] h-[18px] text-white" />
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
          <p className="text-center text-xs text-gray-400 font-medium">DayTrack v1.0.0</p>
        </div>
      </div>

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={userData.avatar}
        userName={userData.name}
        onSaveAvatar={handleSaveAvatar}
      />
    </div>
  );
}
