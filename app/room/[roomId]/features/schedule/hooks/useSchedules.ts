"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
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

export function useSchedules(roomId: string): UseSchedulesResult {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scheduleChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!roomId) return;

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("room_id", roomId)
      .order("scheduled_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load schedules error:", formatSupabaseError(error));
      setErrorMessage("일정 목록을 불러오지 못했습니다.");
      setIsLoading(false);
      return;
    }

    setSchedules((data ?? []) as Schedule[]);
    setIsLoading(false);
  }, [roomId]);

  // 초기 데이터 로드 + Supabase Realtime 구독 (FR-06)
  useEffect(() => {
    if (!roomId) return;

    // 초기 데이터 로드 (fetchSchedules와 동일하나 effect 내 인라인으로 처리)
    supabase
      .from("schedules")
      .select("*")
      .eq("room_id", roomId)
      .order("scheduled_date", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Load schedules error:", formatSupabaseError(error));
          setErrorMessage("일정 목록을 불러오지 못했습니다.");
        } else {
          setSchedules((data ?? []) as Schedule[]);
        }
        setIsLoading(false);
      });

    // INSERT/UPDATE는 DB 이벤트를 쓰고, DELETE는 broadcast로도 보강한다.
    const channel = supabase
      .channel(`schedules:${roomId}`)
      .on("broadcast", { event: "schedule_deleted" }, ({ payload }) => {
        const deletedId = (payload as { id?: string; roomId?: string }).id;
        const deletedRoomId = (payload as { id?: string; roomId?: string }).roomId;
        if (!deletedId || deletedRoomId !== roomId) return;
        setSchedules((prev) => prev.filter((s) => s.id !== deletedId));
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "schedules",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newSchedule = payload.new as Schedule;
          setSchedules((prev) => {
            if (prev.some((s) => s.id === newSchedule.id)) return prev;
            return sortSchedules([...prev, newSchedule]);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "schedules",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as Schedule;
          setSchedules((prev) =>
            sortSchedules(prev.map((s) => (s.id === updated.id ? updated : s)))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "schedules",
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setSchedules((prev) => prev.filter((s) => s.id !== deletedId));
        }
      )
      .subscribe();

    scheduleChannelRef.current = channel;

    return () => {
      scheduleChannelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  const createSchedule = useCallback(
    async (input: ScheduleInput, sessionId?: string | null) => {
      if (!input.title.trim()) {
        setErrorMessage("일정 제목을 입력해주세요.");
        return false;
      }

      if (!input.scheduled_date) {
        setErrorMessage("일정 날짜를 입력해주세요.");
        return false;
      }

      setErrorMessage(null);

      const { data, error } = await supabase
        .from("schedules")
        .insert({
          room_id: roomId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          scheduled_date: input.scheduled_date,
          color: input.color,
          created_by: sessionId ?? null,
        })
        .select("*")
        .single();

      if (error) {
        console.error("Create schedule error:", formatSupabaseError(error));
        setErrorMessage("일정을 생성하지 못했습니다.");
        return false;
      }

      if (data) {
        const created = data as Schedule;
        setSchedules((prev) => {
          if (prev.some((schedule) => schedule.id === created.id)) return prev;
          return sortSchedules([...prev, created]);
        });
      }

      return true;
    },
    [roomId]
  );

  const updateSchedule = useCallback(
    async (id: string, input: ScheduleInput) => {
      if (!input.title.trim()) {
        setErrorMessage("일정 제목을 입력해주세요.");
        return false;
      }

      if (!input.scheduled_date) {
        setErrorMessage("일정 날짜를 입력해주세요.");
        return false;
      }

      setErrorMessage(null);

      const { data, error } = await supabase
        .from("schedules")
        .update({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          scheduled_date: input.scheduled_date,
          color: input.color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("room_id", roomId)
        .select("*")
        .single();

      if (error) {
        console.error("Update schedule error:", formatSupabaseError(error));
        setErrorMessage("일정을 수정하지 못했습니다.");
        return false;
      }

      if (data) {
        const updated = data as Schedule;
        setSchedules((prev) =>
          sortSchedules(prev.map((schedule) => (schedule.id === updated.id ? updated : schedule)))
        );
      }

      return true;
    },
    [roomId]
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      setErrorMessage(null);

      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", id)
        .eq("room_id", roomId);

      if (error) {
        console.error("Delete schedule error:", formatSupabaseError(error));
        setErrorMessage("일정을 삭제하지 못했습니다.");
        return false;
      }

      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
      void scheduleChannelRef.current?.send({
        type: "broadcast",
        event: "schedule_deleted",
        payload: { id, roomId },
      });

      return true;
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
