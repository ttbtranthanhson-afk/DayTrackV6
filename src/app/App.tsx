import { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { useAppTheme } from './hooks/useAppTheme';
import { BottomNav } from './components/BottomNav';
import { useIsDesktop } from './desktop/useIsDesktop';
import { achievementGroupsData } from './data/achievements';
import { syncAchievementsWithTasks } from './hooks/achievementStore';
import { days, type ScheduleTask } from './hooks/scheduleData';
import {
  type UserData,
  getCurrentUser,
  saveCurrentUser,
  saveAccount,
  updateAccount,
} from './hooks/accountStore';

// ── Lazy-loaded pages — mỗi route là 1 chunk riêng ──
// Giảm bundle lần đầu từ 1 chunk lớn → chỉ load page đang dùng
const Timetable = lazy(() => import('./pages/Timetable').then(m => ({ default: m.Timetable })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })));
const Focus = lazy(() => import('./pages/Focus').then(m => ({ default: m.Focus })));
const Achive = lazy(() => import('./pages/Achive').then(m => ({ default: m.Achive })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const Appearance = lazy(() => import('./pages/Appearance').then(m => ({ default: m.Appearance })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const DevFeedbackPanel = lazy(() => import('./pages/DevFeedbackPanel').then(m => ({ default: m.DevFeedbackPanel })));

// Desktop layouts — chunk riêng, chỉ tải trên màn hình lớn
const DesktopApp = lazy(() => import('./desktop/DesktopApp').then(m => ({ default: m.DesktopApp })));
const DesktopLogin = lazy(() => import('./desktop/DesktopLogin').then(m => ({ default: m.DesktopLogin })));

// Fallback hiển thị khi đang lazy-load
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export type { UserData };

export interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate?: string;
  source?: string;
  scheduleName?: string;
  scheduleTaskId?: string;
  weekday?: number;
  dateKey?: string;
  recurrence?: 'daily';
  completedDate?: string;
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData>({ name: '', email: '' });
  const [globalTasks, setGlobalTasks] = useState<Task[]>([]);
  const location = useLocation();
  const isDesktop = useIsDesktop();

  useNotificationScheduler();
  useAppTheme();

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser && savedUser.email) {
      setUserData(savedUser);
      setIsLoggedIn(true);
    }

    try {
      const savedTasks = localStorage.getItem('daytrack_tasks');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) setGlobalTasks(parsed);
      }
    } catch {
      // Dữ liệu hỏng — xóa và dùng mảng rỗng để tránh màn hình trắng
      localStorage.removeItem('daytrack_tasks');
    }
  }, []);

  const handleLogin = (data: UserData) => {
    setUserData(data);
    setIsLoggedIn(true);
    saveCurrentUser(data);
    saveAccount(data);
  };

  const handleUpdateUserData = (updated: Partial<UserData>) => {
    const next = { ...userData, ...updated };
    setUserData(next);
    saveCurrentUser(next);
    if (next.email) {
      updateAccount(next.email, updated);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({ name: '', email: '' });
    saveCurrentUser(null);
  };

  const handleAddTasksFromSchedule = (tasks: ScheduleTask[], scheduleName: string, day: string, dateKey?: string) => {
    const weekday = days.indexOf(day);
    const next = [...globalTasks];

    tasks.forEach(task => {
      const existingIndex = next.findIndex(t => t.scheduleTaskId === task.id);
      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], title: task.title, priority: task.priority };
      } else {
        next.push({
          id: Date.now().toString() + Math.random(),
          title: task.title,
          priority: task.priority,
          completed: false,
          dueDate: day,
          source: 'schedule',
          scheduleName: scheduleName,
          scheduleTaskId: task.id,
          ...(dateKey ? { dateKey } : weekday >= 0 ? { weekday } : {}),
        });
      }
    });

    setGlobalTasks(next);
    localStorage.setItem('daytrack_tasks', JSON.stringify(next));
  };

  const handleUpdateTasks = (tasks: Task[]) => {
    syncAchievementsWithTasks(globalTasks, tasks);
    setGlobalTasks(tasks);
    localStorage.setItem('daytrack_tasks', JSON.stringify(tasks));
  };

  const showBottomNav = isLoggedIn;

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<PageLoader />}>
        {isDesktop
          ? <DesktopLogin onLogin={handleLogin} />
          : <Login onLogin={handleLogin} />}
      </Suspense>
    );
  }

  if (isDesktop) {
    return (
      <div className="size-full">
        <Suspense fallback={<PageLoader />}>
          <DesktopApp
            userData={userData}
            onLogout={handleLogout}
            onUpdateUserData={handleUpdateUserData}
            tasks={globalTasks}
            onUpdateTasks={handleUpdateTasks}
            onAddTasks={handleAddTasksFromSchedule}
          />
        </Suspense>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className="size-full">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/timetable" replace />} />
          <Route path="/timetable" element={<Timetable onAddTasks={handleAddTasksFromSchedule} />} />
          <Route path="/calendar" element={<Calendar onAddTasks={handleAddTasksFromSchedule} />} />
          <Route path="/tasks" element={<Tasks tasks={globalTasks} onUpdateTasks={handleUpdateTasks} />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/achive" element={<Achive />} />
          <Route path="/settings" element={<Settings userData={userData} onLogout={handleLogout} onUpdateUserData={handleUpdateUserData} />} />
          <Route path="/profile" element={<Profile userData={userData} achievements={achievementGroupsData} onUpdateUserData={handleUpdateUserData} />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/appearance" element={<Appearance />} />
          <Route path="/about" element={<About />} />
          <Route path="/dev/feedbacks" element={<DevFeedbackPanel />} />
        </Routes>
      </Suspense>
      {showBottomNav && <BottomNav />}
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}