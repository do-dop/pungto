"use client";

import { useState } from "react";
import { ScheduleFormModal } from "./ScheduleFormModal";
import { useSchedules } from "../hooks/useSchedules";
import type { Schedule, ScheduleColor, ScheduleInput } from "../types";

type ScheduleViewProps = {
  roomId: string;
  sessionId?: string | null;
};

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const eventToneClasses: ScheduleColor[] = ["purple", "teal", "coral"];

function getScheduleColor(schedule: Schedule, fallbackIndex = 0): ScheduleColor {
  if (schedule.color && eventToneClasses.includes(schedule.color)) return schedule.color;
  return eventToneClasses[fallbackIndex % eventToneClasses.length];
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatScheduleMeta(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function ScheduleView({ roomId, sessionId }: ScheduleViewProps) {
  const {
    schedules,
    isLoading,
    errorMessage,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useSchedules(roomId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const today = new Date();
  const todayKey = toDateKey(today);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const visibleYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();
  const visibleMonthKey = `${visibleYear}-${String(visibleMonthIndex + 1).padStart(2, "0")}`;

  const openCreateModal = (date?: string) => {
    setEditingSchedule(null);
    setPrefilledDate(date);
    setIsModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setPrefilledDate(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingSchedule(null);
    setPrefilledDate(undefined);
    setIsModalOpen(false);
  };

  const handleSubmit = async (input: ScheduleInput) => {
    if (editingSchedule) {
      return updateSchedule(editingSchedule.id, input);
    }
    return createSchedule(input, sessionId);
  };

  const handleDelete = async (schedule: Schedule) => {
    const confirmed = window.confirm(`"${schedule.title}" 일정을 삭제할까요?`);
    if (!confirmed) return false;
    return deleteSchedule(schedule.id);
  };

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const schedulesByDate = schedules.reduce<Record<string, Schedule[]>>((acc, schedule) => {
    const dateKey = schedule.scheduled_date.slice(0, 10);
    acc[dateKey] = [...(acc[dateKey] ?? []), schedule];
    return acc;
  }, {});

  const firstDayOfMonth = new Date(visibleYear, visibleMonthIndex, 1);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  const calendarDates = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });

  const visibleSchedules = schedules
    .filter((schedule) => schedule.scheduled_date.startsWith(visibleMonthKey))
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  return (
    <>
      <div className="sched-header">
        <button type="button" className="nav-arrow" onClick={() => moveMonth(-1)}>
          ‹
        </button>
        <span className="sched-month">{visibleYear}년 {visibleMonthIndex + 1}월</span>
        <button type="button" className="nav-arrow" onClick={() => moveMonth(1)}>
          ›
        </button>
      </div>

      {errorMessage && <p className="schedule-error">{errorMessage}</p>}

      <div className="cal-grid">
        {dayLabels.map((day) => (
          <div key={day} className="cal-day-label">{day}</div>
        ))}
        {calendarDates.map((date) => {
          const dateKey = toDateKey(date);
          const daySchedules = schedulesByDate[dateKey] ?? [];
          const isCurrentMonth = date.getMonth() === visibleMonthIndex;

          return (
            <div
              key={dateKey}
              className={`cal-cell ${dateKey === todayKey ? "today" : ""}`}
              onClick={() => openCreateModal(dateKey)}
            >
              <div className={`day-num ${isCurrentMonth ? "" : "muted-day"}`}>{date.getDate()}</div>
              {daySchedules.slice(0, 3).map((schedule, index) => (
                <button
                  key={schedule.id}
                  type="button"
                  className={`cal-event ${getScheduleColor(schedule, index)}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditModal(schedule);
                  }}
                >
                  {schedule.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="sched-list">
        {isLoading ? (
          <div className="sched-empty">일정을 불러오는 중입니다.</div>
        ) : visibleSchedules.length === 0 ? (
          <button type="button" className="sched-empty" onClick={() => openCreateModal(`${visibleMonthKey}-01`)}>
            아직 등록된 일정이 없습니다.
          </button>
        ) : (
          visibleSchedules.map((schedule, index) => (
            <div
              key={schedule.id}
              className="sched-item"
              role="button"
              tabIndex={0}
              onClick={() => openEditModal(schedule)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openEditModal(schedule);
                }
              }}
            >
              <div className={`sched-dot ${getScheduleColor(schedule, index)}`}></div>
              <div className="sched-info">
                <div className="sched-title">{schedule.title}</div>
                <div className="sched-meta">{formatScheduleMeta(schedule.scheduled_date)}{schedule.description ? ` · ${schedule.description}` : ""}</div>
              </div>
              <button
                type="button"
                className="sched-delete"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDelete(schedule);
                }}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ScheduleFormModal
          key={editingSchedule?.id ?? "new"}
          initialSchedule={editingSchedule}
          initialDate={prefilledDate}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}

      <style jsx global>{`
        .cal-event {
          border: none;
          display: block;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }
        .sched-empty {
          width: 100%;
          border: none;
          background: transparent;
          padding: 18px 0;
          color: #aaa;
          font: inherit;
          font-size: 12px;
          text-align: center;
          cursor: pointer;
        }
        .sched-delete {
          border: 1px solid #e0ddd5;
          border-radius: 8px;
          background: #fff;
          color: #aaa;
          padding: 4px 8px;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
          opacity: 0;
        }
        .sched-item:hover .sched-delete,
        .sched-delete:focus-visible {
          opacity: 1;
        }
        .sched-delete:hover {
          border-color: #d85a30;
          color: #d85a30;
        }
        .schedule-error {
          margin: 8px 16px 0;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
        }
        .schedule-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.45);
        }
        .schedule-modal {
          width: min(480px, calc(100vw - 32px));
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 20px;
          border-radius: 18px;
          background: white;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
        }
        .schedule-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .schedule-modal-header h3 {
          margin: 0;
          font-size: 20px;
        }
        .schedule-modal-header button {
          border: none;
          background: transparent;
          font-size: 28px;
          cursor: pointer;
        }
        .schedule-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
        }
        .schedule-field input,
        .schedule-field textarea {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 10px 12px;
          font: inherit;
        }
        .schedule-color-field {
          margin: 0;
          border: none;
          padding: 0;
        }
        .schedule-color-field legend {
          margin-bottom: 6px;
        }
        .schedule-color-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .schedule-color-option {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #e0ddd5;
          border-radius: 8px;
          padding: 7px 10px;
          color: #444;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .schedule-color-option.selected {
          border-color: #534ab7;
          background: #f5f4ff;
        }
        .schedule-color-option input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        .schedule-color-swatch {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .schedule-color-option.purple .schedule-color-swatch {
          background: #534ab7;
        }
        .schedule-color-option.teal .schedule-color-swatch {
          background: #1d9e75;
        }
        .schedule-color-option.coral .schedule-color-swatch {
          background: #d85a30;
        }
        .schedule-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .schedule-modal-delete {
          margin-right: auto;
        }
        .schedule-modal-actions button {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 600;
        }
        .schedule-modal-delete {
          background: #fef2f2;
          color: #dc2626;
        }
        .schedule-modal-cancel {
          background: #f3f4f6;
          color: #374151;
        }
        .schedule-modal-save {
          background: #111827;
          color: white;
        }
      `}</style>
    </>
  );
}
