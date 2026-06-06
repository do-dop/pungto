"use client";

import type { DragEvent } from "react";
import type { KanbanColumnKey, KanbanTask } from "../types";
import { formatDueLabel, toDateInputValue } from "../utils";

type KanbanColumn = {
  key: KanbanColumnKey;
  label: string;
};

type KanbanViewProps = {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  selectedTask: KanbanTask | null;
  selectedTaskId: number | null;
  draggingTaskId: number | null;
  dragOverColumn: KanbanColumnKey | null;
  taskNotice: string;
  onDragOverColumn: (column: KanbanColumnKey) => void;
  onClearDragOverColumn: () => void;
  onDraggingTaskChange: (taskId: number | null) => void;
  onSelectTask: (taskId: number | null) => void;
  onUpdateTask: (taskId: number, patch: Partial<KanbanTask>, options?: { immediate?: boolean }) => void;
  onAddTask: (status: KanbanColumnKey) => void;
  onDeleteTask: (taskId: number) => void;
};

export function KanbanView({
  columns,
  tasks,
  selectedTask,
  selectedTaskId,
  draggingTaskId,
  dragOverColumn,
  taskNotice,
  onDragOverColumn,
  onClearDragOverColumn,
  onDraggingTaskChange,
  onSelectTask,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
}: KanbanViewProps) {
  const handleDrop = (event: DragEvent<HTMLDivElement>, columnKey: KanbanColumnKey) => {
    event.preventDefault();

    if (draggingTaskId !== null) {
      const draggingTask = tasks.find((task) => task.id === draggingTaskId);
      if (draggingTask && draggingTask.status !== columnKey) {
        onUpdateTask(draggingTaskId, { status: columnKey }, { immediate: true });
      }
    }

    onDraggingTaskChange(null);
    onClearDragOverColumn();
  };

  return (
    <div className="page active">
      <div className="kanban">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          const isOver = dragOverColumn === column.key && draggingTaskId !== null;
          return (
            <div
              className={`k-col${isOver ? " drag-over" : ""}`}
              key={column.key}
              onDragOver={(event) => {
                event.preventDefault();
                onDragOverColumn(column.key);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  onClearDragOverColumn();
                }
              }}
              onDrop={(event) => handleDrop(event, column.key)}
            >
              <div className="k-col-title">{column.label} <span className="k-count">{columnTasks.length}</span></div>
              {columnTasks.map((task) => (
                <button
                  className={`k-card${selectedTaskId === task.id ? " selected" : ""}${task.status === "done" ? " faded" : ""}${draggingTaskId === task.id ? " dragging" : ""}`}
                  key={task.id}
                  draggable
                  onClick={() => { if (draggingTaskId === null) onSelectTask(task.id); }}
                  onDragStart={(event) => {
                    onDraggingTaskChange(task.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    onDraggingTaskChange(null);
                    onClearDragOverColumn();
                  }}
                  type="button"
                >
                  <div className="k-card-title">{task.title}</div>
                  <div className="k-card-meta">
                    <span className={`k-tag ${task.categoryClass}`}>{task.category}</span>
                    <span className="k-owner">{task.owner}</span>
                  </div>
                  <div className={`k-due ${task.overdue ? "overdue" : ""}`}>{formatDueLabel(task.due, task.overdue)}</div>
                </button>
              ))}
              <button className="k-add" type="button" onClick={() => onAddTask(column.key)}>+ 카드 추가</button>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <div className="task-modal-backdrop" onClick={() => onSelectTask(null)}>
          <div className="task-modal" onClick={(event) => event.stopPropagation()}>
            <div className="task-panel-top">
              <div>
                <p className="task-panel-eyebrow">태스크 상세</p>
                <h3 className="task-panel-title">{selectedTask.title}</h3>
                {taskNotice ? <p className="task-panel-notice">{taskNotice}</p> : null}
              </div>
              <div className="task-modal-actions">
                <span className={`task-status-chip status-${selectedTask.status}`}>{columns.find((column) => column.key === selectedTask.status)?.label}</span>
                <button className="task-delete" type="button" onClick={() => onDeleteTask(selectedTask.id)}>삭제</button>
                <button className="task-close" type="button" onClick={() => onSelectTask(null)}>닫기</button>
              </div>
            </div>

            <div className="task-form">
              <label className="task-field">
                <span>제목</span>
                <input
                  className="task-input"
                  value={selectedTask.title}
                  onChange={(event) => onUpdateTask(selectedTask.id, { title: event.target.value })}
                />
              </label>

              <div className="task-field-grid">
                <label className="task-field">
                  <span>상태</span>
                  <select
                    className="task-input"
                    value={selectedTask.status}
                    onChange={(event) => onUpdateTask(selectedTask.id, { status: event.target.value as KanbanColumnKey }, { immediate: true })}
                  >
                    {columns.map((column) => (
                      <option key={column.key} value={column.key}>{column.label}</option>
                    ))}
                  </select>
                </label>

                <label className="task-field">
                  <span>마감 날짜</span>
                  <input
                    className="task-input"
                    type="date"
                    value={selectedTask.status === "done" ? "" : toDateInputValue(selectedTask.due)}
                    onChange={(event) => onUpdateTask(selectedTask.id, { due: event.target.value || "미정" }, { immediate: true })}
                    disabled={selectedTask.status === "done"}
                  />
                </label>
              </div>

              <div className="task-field-grid">
                <label className="task-field">
                  <span>분류</span>
                  <input
                    className="task-input"
                    value={selectedTask.category}
                    onChange={(event) => onUpdateTask(selectedTask.id, { category: event.target.value })}
                  />
                </label>

                <label className="task-field">
                  <span>담당</span>
                  <input
                    className="task-input"
                    value={selectedTask.owner}
                    onChange={(event) => onUpdateTask(selectedTask.id, { owner: event.target.value })}
                  />
                </label>
              </div>

              <label className="task-field">
                <span>설명</span>
                <textarea
                  className="task-textarea"
                  value={selectedTask.description}
                  onChange={(event) => onUpdateTask(selectedTask.id, { description: event.target.value })}
                />
              </label>

              <label className="task-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(selectedTask.overdue)}
                  disabled={selectedTask.status === "done"}
                  onChange={(event) => onUpdateTask(selectedTask.id, { overdue: event.target.checked }, { immediate: true })}
                />
                <span>마감 초과 표시</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
