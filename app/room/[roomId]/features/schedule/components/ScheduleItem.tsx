"use client";

import type { Schedule } from "../types";

type ScheduleItemProps = {
  schedule: Schedule;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
};

export function ScheduleItem({ schedule, onEdit, onDelete }: ScheduleItemProps) {
  return (
    <article className="schedule-item">
      <div className="schedule-item-main">
        <span className="schedule-date">{schedule.scheduled_date}</span>
        <h4>{schedule.title}</h4>
        {schedule.description && <p>{schedule.description}</p>}
      </div>

      <div className="schedule-item-actions">
        <button type="button" onClick={() => onEdit(schedule)}>
          수정
        </button>
        <button type="button" onClick={() => onDelete(schedule)}>
          삭제
        </button>
      </div>
    </article>
  );
}