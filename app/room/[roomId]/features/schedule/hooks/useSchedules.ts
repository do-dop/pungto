"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteScheduleRow,
  insertScheduleRow,
  loadScheduleRows,
  subscribeToSchedules,
  updateScheduleRow,
} from "../services/scheduleService";
import type { Schedule, ScheduleInput } from "../types";

type UseSchedulesResult = {
  schedules: Schedule[];
  isLoading: boolean;
  errorMessage: string | null;
  fetchSchedules: () => Promise<void>;
  createSchedule: (input: ScheduleInput, sessionId?: string | null) => Promise<boolean>;
  updateSchedule: (id: string, input: ScheduleInput) => Promise<boolean>;
  deleteSchedule: (id: string) => Promise<boolean>;
};

type ScheduleSubscription = ReturnType<typeof subscribeToSchedules>;

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return error;

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  return {
    code: candidate.code,
    message: candidate.message,
    details: candidate.details,
    hint: candidate.hint,
  };
}

function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort(
    (a, b) =>
      a.scheduled_date.localeCompare(b.scheduled_date) ||
      a.created_at.localeCompare(b.created_at)
  );
}

function validateScheduleInput(input: ScheduleInput) {
  if (!input.title.trim()) return "일정 제목을 입력해주세요.";
  if (!input.scheduled_date) return "일정 날짜를 입력해주세요.";
  return null;
}

export function useSchedules(roomId: string): UseSchedulesResult {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scheduleSubscriptionRef = useRef<ScheduleSubscription | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!roomId) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      setSchedules(await loadScheduleRows(roomId));
    } catch (error) {
      console.error("Load schedules error:", formatSupabaseError(error));
      setErrorMessage("일정 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    void fetchSchedules();

    const subscription = subscribeToSchedules(roomId, (payload) => {
      if (payload.eventType === "INSERT" && payload.schedule) {
        const nextSchedule = payload.schedule;
        setSchedules((prev) => {
          if (prev.some((schedule) => schedule.id === nextSchedule.id)) return prev;
          return sortSchedules([...prev, nextSchedule]);
        });
        return;
      }

      if (payload.eventType === "UPDATE" && payload.schedule) {
        const nextSchedule = payload.schedule;
        setSchedules((prev) =>
          sortSchedules(prev.map((schedule) => (schedule.id === nextSchedule.id ? nextSchedule : schedule)))
        );
        return;
      }

      if ((payload.eventType === "DELETE" || payload.eventType === "BROADCAST_DELETE") && payload.deletedId && payload.deletedRoomId === roomId) {
        setSchedules((prev) => prev.filter((schedule) => schedule.id !== payload.deletedId));
      }
    });

    scheduleSubscriptionRef.current = subscription;

    return () => {
      scheduleSubscriptionRef.current = null;
      subscription.unsubscribe();
    };
  }, [fetchSchedules, roomId]);

  const createSchedule = useCallback(
    async (input: ScheduleInput, sessionId?: string | null) => {
      const validationError = validateScheduleInput(input);
      if (validationError) {
        setErrorMessage(validationError);
        return false;
      }

      setErrorMessage(null);

      try {
        const created = await insertScheduleRow(roomId, input, sessionId);
        setSchedules((prev) => {
          if (prev.some((schedule) => schedule.id === created.id)) return prev;
          return sortSchedules([...prev, created]);
        });
        return true;
      } catch (error) {
        console.error("Create schedule error:", formatSupabaseError(error));
        setErrorMessage("일정을 생성하지 못했습니다.");
        return false;
      }
    },
    [roomId]
  );

  const updateSchedule = useCallback(
    async (id: string, input: ScheduleInput) => {
      const validationError = validateScheduleInput(input);
      if (validationError) {
        setErrorMessage(validationError);
        return false;
      }

      setErrorMessage(null);

      try {
        const updated = await updateScheduleRow(roomId, id, input);
        setSchedules((prev) =>
          sortSchedules(prev.map((schedule) => (schedule.id === updated.id ? updated : schedule)))
        );
        return true;
      } catch (error) {
        console.error("Update schedule error:", formatSupabaseError(error));
        setErrorMessage("일정을 수정하지 못했습니다.");
        return false;
      }
    },
    [roomId]
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      setErrorMessage(null);

      try {
        await deleteScheduleRow(roomId, id);
        setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
        void scheduleSubscriptionRef.current?.sendDeleteBroadcast(id);
        return true;
      } catch (error) {
        console.error("Delete schedule error:", formatSupabaseError(error));
        setErrorMessage("일정을 삭제하지 못했습니다.");
        return false;
      }
    },
    [roomId]
  );

  return {
    schedules,
    isLoading,
    errorMessage,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  };
}
