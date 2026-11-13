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
  Plus,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CreateScheduleModal } from '../../components/CreateScheduleModal';
import { BusyHoursModal } from '../../components/BusyHoursModal';
import { AiPlannerModal } from '../../components/AiPlannerModal';
import { useCalendar, weekDays, holidays, monthNames } from '../../hooks/useCalendar';
import { useAiPlanner } from '../../hooks/useAiPlanner';
import type { ScheduleTask } from '../../hooks/scheduleData';
import { DesktopPageHeader } from '../DesktopUI';

interface DesktopCalendarProps {
  onAddTasks?: (tasks: ScheduleTask[], scheduleName: string, day: string, dateKey?: string) => void;
}

export function DesktopCalendar({ onAddTasks }: DesktopCalendarProps) {
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
    openCreateSchedule,
    closeModal,
    offset,
    daysInMonth,
    isLocked,
    currentSchedules,
    weekdayForSelected,
    weekdaySchedule,
    getDaySchedules,
    todayDate,
    toggleLock,
    handleSaveSchedule,
    handleDeleteSchedule,
  } = useCalendar({ onAddTasks });

  const [showYearPicker, setShowYearPicker] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);

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

  const yearsList = Array.from({ length: 16 }, (_, i) => currentYear - 5 + i);

  const planner = useAiPlanner(weekdayForSelected, weekdaySchedule, {
    onAddTasks,
    successMessage: `Đã áp dụng lịch AI cho ${weekdayForSelected}`,
  });

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <DesktopPageHeader
        title="Lịch"
        subtitle={`${monthNames[currentMonth]} năm ${currentYear}`}
        actions={
          <div className="flex items-center gap-2">
            {/* Year Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowYearPicker(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-bold border border-purple-200 transition-all"
                title="Chọn năm"
              >
                <span>Năm {currentYear}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showYearPicker ? 'rotate-180' : ''}`} />
              </button>

              {showYearPicker && (
                <div
                  ref={yearPickerRef}
                  className="absolute right-0 top-full mt-2 z-30 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Chọn năm</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={goToPrevYear}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Năm trước"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={goToToday}
                        className="text-[11px] font-semibold text-purple-600 hover:bg-purple-50 px-2 py-0.5 rounded-md"
                        title="Về hiện tại"
                      >
                        Hiện tại
                      </button>
                      <button
                        type="button"
                        onClick={goToNextYear}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        title="Năm sau"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                    {yearsList.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setYear(y);
                          setShowYearPicker(false);
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          y === currentYear
                            ? 'bg-purple-600 text-white shadow-sm'
                            : y === new Date().getFullYear()
                            ? 'bg-purple-50 text-purple-700 font-extrabold border border-purple-200 hover:bg-purple-100'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
              <button
                type="button"
                onClick={goToPrevYear}
                title="Lùi 1 năm"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
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
                onClick={goToToday}
                className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Hôm nay
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
                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      <div className="flex-1 min-h-0 grid grid-cols-3 gap-6">
        {/* Month grid */}
        <div className="col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col min-h-0">
          <div className="grid grid-cols-7 mb-1.5">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-1.5">{d}</div>
            ))}
          </div>
          <motion.div
            key={`${currentYear}-${currentMonth}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="grid grid-cols-7 grid-rows-6 gap-1 flex-1 min-h-0"
          >
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const isToday = day === todayDate;
              const isSelected = day === selectedDay;
              const holiday = holidays[day];
              const dayScheduleList = getDaySchedules(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`h-full min-h-0 p-1 rounded-xl flex flex-col items-center justify-start overflow-hidden transition-all border ${
                    isSelected
                      ? 'border-purple-300 bg-purple-50'
                      : isToday
                      ? 'border-transparent bg-purple-100'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                    isToday ? 'bg-gray-900 text-white font-bold' : isSelected ? 'text-purple-700 font-bold' : 'text-gray-700 font-medium'
                  }`}>
                    {day}
                  </span>
                  {holiday && (
                    <span className="text-[8px] text-rose-400 font-semibold truncate w-full text-center leading-tight">{holiday}</span>
                  )}
                  {dayScheduleList.length > 0 && !holiday && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayScheduleList.slice(0, 4).map((s, i) => (
                        <span key={i} className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Selected day detail */}
        <div className="col-span-1 min-h-0">
          <div className="h-full bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col min-h-0">
            <div className="flex items-center gap-1 px-5 pt-4 pb-3 border-b border-gray-50">
              <span className="text-sm font-bold text-gray-800 flex-1">
                {selectedDay} tháng {currentMonth + 1}
              </span>
              <button
                onClick={openCreateSchedule}
                className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleLock(selectedDay)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  isLocked ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>

            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1"
            >
              {currentSchedules.length > 0 ? (
                currentSchedules.map(s => {
                  const editable = s.source === 'date';
                  return (
                    <div key={s.id} className="flex items-center group">
                      <div className={`w-1 self-stretch rounded-full mr-3 flex-shrink-0 ${s.color}`} style={{ minHeight: '40px' }} />
                      <div className="flex-1 py-2 border-b border-gray-50 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.time}</p>
                        {s.tasks && s.tasks.length > 0 && (
                          <p className="text-xs text-gray-400">{s.tasks.length} nhiệm vụ</p>
                        )}
                      </div>
                      {editable && (
                        <div className="flex items-center ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditSchedule(s)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-50 text-purple-400">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteSchedule(s.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-sm text-gray-300 font-semibold py-8">Chưa có lịch</p>
              )}
            </motion.div>

            <div className="p-4 pt-0">
              <button
                onClick={planner.openSurvey}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-green-200 text-green-500 hover:bg-green-50 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm font-semibold">Khảo sát</span>
              </button>
            </div>
          </div>
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
