"use client";

import { useState } from "react";
import type { Schedule } from "../types";

type CalendarViewProps = {
  schedules: Schedule[];
  onDateClick: (date: string) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const EVENT_COLORS = [
  { bg: "#ddd6fe", text: "#5b21b6" },
  { bg: "#bfdbfe", text: "#1e40af" },
  { bg: "#fecaca", text: "#991b1b" },
  { bg: "#a7f3d0", text: "#065f46" },
  { bg: "#fed7aa", text: "#9a3412" },
  { bg: "#e9d5ff", text: "#6b21a8" },
  { bg: "#bae6fd", text: "#0c4a6e" },
  { bg: "#fde68a", text: "#92400e" },
];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatKoreanDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

export function CalendarView({ schedules, onDateClick, onEdit, onDelete }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toLocalDateString(today);

  // 색상을 스케줄 id 기반으로 일관되게 지정
  const colorMap = new Map<string, (typeof EVENT_COLORS)[0]>();
  schedules.forEach((s, i) => {
    colorMap.set(s.id, EVENT_COLORS[i % EVENT_COLORS.length]);
  });

  const schedulesByDate = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const d = s.scheduled_date.slice(0, 10);
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // 이번 달 이후 일정만 어젠다로 표시
  const agendaSchedules = schedules
    .filter(s => s.scheduled_date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, "0")}`)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  return (
    <div className="cal-root">
      {/* 달력 헤더 */}
      <div className="cal-header">
        <button type="button" className="cal-nav-btn" onClick={prevMonth}>&#8249;</button>
        <span className="cal-title">{year}년 {month + 1}월</span>
        <button type="button" className="cal-nav-btn" onClick={nextMonth}>&#8250;</button>
      </div>

      {/* 달력 그리드 */}
      <div className="cal-grid">
        {DAYS.map((d, i) => (
          <div key={d} className={`cal-dow${i === 0 ? " sun" : i === 6 ? " sat" : ""}`}>{d}</div>
        ))}

        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="cal-cell empty" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const daySchedules = schedulesByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const dow = (firstDay + day - 1) % 7;
          const isSun = dow === 0;
          const isSat = dow === 6;

          return (
            <div
              key={dateStr}
              className={`cal-cell${isToday ? " today" : ""}${isSun ? " sun" : isSat ? " sat" : ""}`}
              onClick={() => onDateClick(dateStr)}
            >
              <span className={`cal-day-num${isToday ? " today-num" : ""}`}>{day}</span>
              <div className="cal-events">
                {daySchedules.slice(0, 3).map(s => {
                  const color = colorMap.get(s.id) ?? EVENT_COLORS[0];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className="cal-event-bar"
                      style={{ background: color.bg, color: color.text }}
                      onClick={e => { e.stopPropagation(); onEdit(s); }}
                    >
                      {s.title}
                    </button>
                  );
                })}
                {daySchedules.length > 3 && (
                  <span className="cal-more">+{daySchedules.length - 3}개</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 어젠다 리스트 */}
      {agendaSchedules.length > 0 && (
        <div className="cal-agenda">
          {agendaSchedules.map(s => {
            const color = colorMap.get(s.id) ?? EVENT_COLORS[0];
            return (
              <div key={s.id} className="agenda-row">
                <span className="agenda-dot" style={{ background: color.bg, borderColor: color.text }} />
                <div className="agenda-info">
                  <span className="agenda-title">{s.title}</span>
                  {s.description && <span className="agenda-desc">{s.description}</span>}
                </div>
                <span className="agenda-date">{formatKoreanDate(s.scheduled_date)}</span>
                <div className="agenda-actions">
                  <button type="button" onClick={() => onEdit(s)}>수정</button>
                  <button type="button" onClick={() => onDelete(s)}>삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .cal-root {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .cal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 4px 16px;
        }
        .cal-nav-btn {
          border: none;
          background: transparent;
          font-size: 20px;
          color: #9ca3af;
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }
        .cal-nav-btn:hover { background: #f3f4f6; color: #111827; }
        .cal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        .cal-dow {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 10px 0;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .cal-dow.sun { color: #ef4444; }
        .cal-dow.sat { color: #3b82f6; }
        .cal-cell {
          min-height: 96px;
          padding: 8px 6px 6px;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: white;
          transition: background 0.1s;
        }
        .cal-cell:nth-child(7n) { border-right: none; }
        .cal-cell:hover:not(.empty) { background: #f9fafb; }
        .cal-cell.empty { cursor: default; background: #fafafa; }
        .cal-cell.sun .cal-day-num { color: #ef4444; }
        .cal-cell.sat .cal-day-num { color: #3b82f6; }
        .cal-day-num {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cal-day-num.today-num {
          background: #111827;
          color: white;
          font-weight: 700;
        }
        .cal-events {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .cal-event-bar {
          border: none;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          line-height: 1.6;
        }
        .cal-more {
          font-size: 10px;
          color: #9ca3af;
          padding: 0 4px;
        }
        /* 어젠다 */
        .cal-agenda {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }
        .agenda-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
          background: white;
        }
        .agenda-row:last-child { border-bottom: none; }
        .agenda-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid;
          flex-shrink: 0;
        }
        .agenda-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .agenda-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .agenda-desc {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .agenda-date {
          font-size: 12px;
          color: #6b7280;
          flex-shrink: 0;
        }
        .agenda-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .agenda-actions button {
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .agenda-actions button:first-child { background: #eff6ff; color: #1d4ed8; }
        .agenda-actions button:last-child { background: #fef2f2; color: #dc2626; }
      `}</style>
    </div>
  );
}
