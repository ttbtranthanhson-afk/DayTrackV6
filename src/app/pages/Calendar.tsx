import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Lock,
  Unlock,
  Trash2,
  Pencil,
  Search,
  RotateCcw,
} from 'lucide-react';
import { CreateScheduleModal } from '../components/CreateScheduleModal';
import { BusyHoursModal } from '../components/BusyHoursModal';
import { AiPlannerModal } from '../components/AiPlannerModal';
import { useCalendar, weekDays, holidays, monthNames } from '../hooks/useCalendar';
import { useAiPlanner } from '../hooks/useAiPlanner';
import type { ScheduleTask } from '../hooks/scheduleData';

interface CalendarProps {
  onAddTasks?: (tasks: ScheduleTask[], scheduleName: string, day: string, dateKey?: string) => void;
}

export function Calendar({ onAddTasks }: CalendarProps) {
  const {
    currentMonth,
    setCurrentMonth,
    currentYear,
    setCurrentYear,
    goToPrevMonth,
    goToNextMonth,
    goToPrevYear,
    goToNextYear,
    setYear,
    goToToday,
    selectedDay,
    setSelectedDay,
    isModalOpen,
    editingBlock,
    openEditSchedule,
    closeModal,
    offset,
    daysInMonth,
    isLocked,
    currentSchedules,
    weekdayForSelected,
    weekdaySchedule,
    getDaySchedules,
    todayDate,
    isCurrentMonth,
    toggleLock,
    handleSaveSchedule,
    handleDeleteSchedule,
  } = useCalendar({ onAddTasks });

  const [showYearPicker, setShowYearPicker] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  // Đóng year picker khi nhấp ra ngoài
  useEffect(() => {
    if (!showYearPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target as Node)) {
        setShowYearPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showYearPicker]);

  const planner = useAiPlanner(weekdayForSelected, weekdaySchedule, {
    onAddTasks,
    successMessage: `Đã áp dụng lịch AI cho ${weekdayForSelected}`,
  });

  // Tạo danh sách 12 năm xung quanh năm hiện tại để chọn nhanh
  const startYear = Math.floor(currentYear / 12) * 12;
  const yearsList = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="px-5 pt-12 pb-2">
          <div className="flex items-center justify-between">
            <div className="relative">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{monthNames[currentMonth]}</h1>
                <button
                  type="button"
                  onClick={() => setShowYearPicker(v => !v)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold border border-purple-200 hover:bg-purple-100 transition-all active:scale-95"
                  title="Nhấn để chọn năm khác"
                >
                  <span>{currentYear}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showYearPicker ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Lịch & sự kiện</p>

              {/* Year Picker Dropdown */}
              {showYearPicker && (
                <div
                  ref={yearPickerRef}
                  className="absolute left-0 top-full mt-2 z-30 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Chọn năm</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => goToPrevYear()}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Năm trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => goToToday()}
                        className="text-[11px] font-semibold text-purple-600 hover:bg-purple-50 px-2 py-0.5 rounded-md"
                        title="Về năm hiện tại"
                      >
                        Hiện tại
                      </button>
                      <button
                        type="button"
                        onClick={() => goToNextYear()}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Năm sau"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                    {yearsList.map(y => {
                      const isSelected = y === currentYear;
                      const isRealYear = y === new Date().getFullYear();
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setYear(y);
                            setShowYearPicker(false);
                          }}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-sm'
                              : isRealYear
                              ? 'bg-purple-50 text-purple-700 font-extrabold border border-purple-200 hover:bg-purple-100'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={goToPrevYear}
                title="Lùi 1 năm"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToPrevMonth}
                title="Tháng trước"
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                title="Tháng sau"
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goToNextYear}
                title="Tiến 1 năm"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-5 mt-4 mb-1">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-5">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const isToday = day === todayDate;
            const isSelected = day === selectedDay;
            const holiday = holidays[day];
            const dayScheduleList = getDaySchedules(day);
            const hasSchedule = dayScheduleList.length > 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="aspect-square flex flex-col items-center justify-center relative py-0.5"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                  isToday
                    ? 'bg-gray-900 text-white'
                    : isSelected
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}>
                  <span className={`text-sm ${isToday || isSelected ? 'font-bold' : 'font-medium'}`}>{day}</span>
                </div>
                {holiday && (
                  <span className="text-[8px] text-rose-400 font-semibold leading-tight text-center px-0.5 truncate w-full">
                    {holiday}
                  </span>
                )}
                {hasSchedule && !holiday && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayScheduleList.slice(0, 3).map((s, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${s.color}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-5 mt-4 border-t border-gray-100" />

        {/* Selected day schedule */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-base font-bold text-gray-900">
                {selectedDay} tháng {currentMonth + 1}, {currentYear}
              </span>
              {isLocked && (
                <span className="ml-2 text-xs text-purple-500 font-semibold">· Đã khóa</span>
              )}
            </div>
            <button
              onClick={() => toggleLock(selectedDay)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                isLocked ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>

          {/* Schedule list */}
          <div className="space-y-px mb-4">
            {currentSchedules.length > 0 ? currentSchedules.map(s => {
              const editable = s.source === 'date';
              return (
                <div
                  key={s.id}
                  role={editable ? 'button' : undefined}
                  tabIndex={editable ? 0 : undefined}
                  onClick={editable ? () => openEditSchedule(s) : undefined}
                  onKeyDown={editable ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEditSchedule(s);
                    }
                  } : undefined}
                  className={`flex items-center group ${editable ? 'cursor-pointer' : ''}`}
                >
                  <div className={`w-1 self-stretch rounded-full mr-3 flex-shrink-0 ${s.color}`}
                    style={{ minHeight: '48px' }} />
                  <div className="flex-1 py-3 border-b border-gray-50">
                    <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.time}</p>
                    {s.tasks && s.tasks.length > 0 && (
                      <p className="text-xs text-gray-400">{s.tasks.length} nhiệm vụ</p>
                    )}
                  </div>
                  {editable && (
                    <div className="flex items-center ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditSchedule(s); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-50 text-purple-400 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(s.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-300 font-semibold">Chưa có lịch</p>
              </div>
            )}
          </div>

          <button
            onClick={planner.openSurvey}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-dashed border-green-200 text-green-500 hover:bg-green-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm font-semibold">Khảo sát</span>
          </button>
        </div>
      </div>

      <CreateScheduleModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveSchedule}
        day={`${selectedDay} tháng ${currentMonth + 1}, ${currentYear}`}
        initialData={editingBlock}
      />

      <BusyHoursModal
        isOpen={planner.busyOpen}
        onClose={planner.closeSurvey}
        schedule={weekdaySchedule}
        day={weekdayForSelected}
        onGeneratePlan={planner.generate}
      />

      <AiPlannerModal
        isOpen={planner.plannerOpen}
        onClose={planner.closePlanner}
        schedule={weekdaySchedule}
        day={weekdayForSelected}
        busy={planner.busy}
        onApply={planner.apply}
      />
    </div>
  );
}
