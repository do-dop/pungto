"use client";

import { useState } from "react";
import { ScheduleFormModal } from "./ScheduleFormModal";
import { ScheduleItem } from "./ScheduleItem";
import { useSchedules } from "../hooks/useSchedules";
import type { Schedule, ScheduleInput } from "../types";

type ScheduleViewProps = {
  roomId: string;
  sessionId?: string | null;
};

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

  const openCreateModal = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingSchedule(null);
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
    if (!confirmed) return;

    await deleteSchedule(schedule.id);
  };

  return (
    <section className="schedule-view">
      <div className="schedule-header">
        <div>
          <h2>일정</h2>
          <p>현재 방의 주요 일정을 함께 관리합니다.</p>
        </div>
        <button type="button" onClick={openCreateModal}>
          일정 추가
        </button>
      </div>

      {errorMessage && <p className="schedule-error">{errorMessage}</p>}

      {isLoading ? (
        <p className="schedule-empty">일정을 불러오는 중입니다.</p>
      ) : schedules.length === 0 ? (
        <p className="schedule-empty">아직 등록된 일정이 없습니다.</p>
      ) : (
        <div className="schedule-list">
          {schedules.map((schedule) => (
            <ScheduleItem
              key={schedule.id}
              schedule={schedule}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <ScheduleFormModal
          key={editingSchedule?.id ?? "new"}
          initialSchedule={editingSchedule}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      <style jsx global>{`
        .schedule-view {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .schedule-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .schedule-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .schedule-header p {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .schedule-header button,
        .schedule-modal-actions button,
        .schedule-item-actions button {
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .schedule-header button {
          background: #111827;
          color: white;
        }

        .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .schedule-item {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: white;
        }

        .schedule-item-main h4 {
          margin: 6px 0;
          font-size: 18px;
        }

        .schedule-item-main p {
          margin: 0;
          color: #4b5563;
          font-size: 14px;
        }

        .schedule-date {
          color: #2563eb;
          font-weight: 700;
          font-size: 13px;
        }

        .schedule-item-actions {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .schedule-item-actions button:first-child {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .schedule-item-actions button:last-child {
          background: #fef2f2;
          color: #dc2626;
        }

        .schedule-empty {
          padding: 24px;
          border: 1px dashed #d1d5db;
          border-radius: 14px;
          color: #6b7280;
          text-align: center;
        }

        .schedule-error {
          color: #dc2626;
          font-size: 14px;
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

        .schedule-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .schedule-modal-actions button:first-child {
          background: #f3f4f6;
          color: #374151;
        }

        .schedule-modal-actions button:last-child {
          background: #111827;
          color: white;
        }
      `}</style>
    </section>
  );
}
