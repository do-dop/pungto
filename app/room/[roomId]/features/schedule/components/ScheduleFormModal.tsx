"use client";

import { useState } from "react";
import type { Schedule, ScheduleInput } from "../types";

type ScheduleFormModalProps = {
  initialSchedule?: Schedule | null;
  onClose: () => void;
  onSubmit: (input: ScheduleInput) => Promise<boolean>;
};

export function ScheduleFormModal({
  initialSchedule,
  onClose,
  onSubmit,
}: ScheduleFormModalProps) {
  const [title, setTitle] = useState(initialSchedule?.title ?? "");
  const [scheduledDate, setScheduledDate] = useState(initialSchedule?.scheduled_date ?? "");
  const [description, setDescription] = useState(initialSchedule?.description ?? "");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialSchedule);

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
    });

    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="schedule-modal-backdrop">
      <div className="schedule-modal">
        <div className="schedule-modal-header">
          <h3>{isEditing ? "일정 수정" : "일정 추가"}</h3>
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

        {localError && <p className="schedule-error">{localError}</p>}

        <div className="schedule-modal-actions">
          <button type="button" onClick={onClose} disabled={isSubmitting}>
            취소
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
