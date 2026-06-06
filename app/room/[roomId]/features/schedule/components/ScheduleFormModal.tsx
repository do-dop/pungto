"use client";

import { useEffect, useId, useState } from "react";
import type { Schedule, ScheduleColor, ScheduleInput } from "../types";

type ScheduleFormModalProps = {
  initialSchedule?: Schedule | null;
  initialDate?: string;
  onClose: () => void;
  onSubmit: (input: ScheduleInput) => Promise<boolean>;
  onDelete?: (schedule: Schedule) => Promise<boolean>;
};

const scheduleColors: Array<{ value: ScheduleColor; label: string }> = [
  { value: "purple", label: "보라" },
  { value: "teal", label: "민트" },
  { value: "coral", label: "코랄" },
];

export function ScheduleFormModal({
  initialSchedule,
  initialDate,
  onClose,
  onSubmit,
  onDelete,
}: ScheduleFormModalProps) {
  const [title, setTitle] = useState(initialSchedule?.title ?? "");
  const [scheduledDate, setScheduledDate] = useState(initialSchedule?.scheduled_date ?? initialDate ?? "");
  const [description, setDescription] = useState(initialSchedule?.description ?? "");
  const [color, setColor] = useState<ScheduleColor>(initialSchedule?.color ?? "purple");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialSchedule);
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleDelete = async () => {
    if (!initialSchedule || !onDelete) return;

    setIsSubmitting(true);
    setLocalError(null);

    const success = await onDelete(initialSchedule);

    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setLocalError("일정 제목을 입력해주세요.");
      return;
    }

    if (!scheduledDate) {
      setLocalError("일정 날짜를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    const success = await onSubmit({
      title,
      scheduled_date: scheduledDate,
      description,
      color,
    });

    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="schedule-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="schedule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="schedule-modal-header">
          <h3 id={titleId}>{isEditing ? "일정 수정" : "일정 추가"}</h3>
          <button type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <label className="schedule-field">
          <span>제목</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 중간 발표 회의"
          />
        </label>

        <label className="schedule-field">
          <span>날짜</span>
          <input
            type="date"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
          />
        </label>

        <label className="schedule-field">
          <span>설명</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="일정 설명을 입력하세요."
            rows={4}
          />
        </label>

        <fieldset className="schedule-field schedule-color-field">
          <legend>색상</legend>
          <div className="schedule-color-options">
            {scheduleColors.map((option) => (
              <label key={option.value} className={`schedule-color-option ${option.value} ${color === option.value ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="schedule-color"
                  value={option.value}
                  checked={color === option.value}
                  onChange={() => setColor(option.value)}
                />
                <span className="schedule-color-swatch" aria-hidden="true" />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {localError && <p className="schedule-error">{localError}</p>}

        <div className="schedule-modal-actions">
          {isEditing && onDelete ? (
            <button type="button" className="schedule-modal-delete" onClick={handleDelete} disabled={isSubmitting}>
              삭제
            </button>
          ) : null}
          <button type="button" className="schedule-modal-cancel" onClick={onClose} disabled={isSubmitting}>
            취소
          </button>
          <button type="button" className="schedule-modal-save" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
