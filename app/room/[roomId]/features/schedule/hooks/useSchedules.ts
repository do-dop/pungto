"use client";

import { useCallback, useEffect, useState } from "react";
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

export function useSchedules(roomId: string): UseSchedulesResult {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage("일정 목록을 불러오지 못했습니다.");
      setIsLoading(false);
      return;
    }

    setSchedules((data ?? []) as Schedule[]);
    setIsLoading(false);
  }, [roomId]);

  useEffect(() => {
    let isActive = true;

    async function loadSchedules() {
      if (!roomId) return;

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("room_id", roomId)
        .order("scheduled_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (!isActive) return;

      if (error) {
        setErrorMessage("일정 목록을 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }

      setSchedules((data ?? []) as Schedule[]);
      setIsLoading(false);
    }

    void loadSchedules();

    return () => {
      isActive = false;
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

      const { error } = await supabase.from("schedules").insert({
        room_id: roomId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        scheduled_date: input.scheduled_date,
        created_by: sessionId ?? null,
      });

      if (error) {
        setErrorMessage("일정을 생성하지 못했습니다.");
        return false;
      }

      await fetchSchedules();
      return true;
    },
    [fetchSchedules, roomId]
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

      const { error } = await supabase
        .from("schedules")
        .update({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          scheduled_date: input.scheduled_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("room_id", roomId);

      if (error) {
        setErrorMessage("일정을 수정하지 못했습니다.");
        return false;
      }

      await fetchSchedules();
      return true;
    },
    [fetchSchedules, roomId]
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
        setErrorMessage("일정을 삭제하지 못했습니다.");
        return false;
      }

      await fetchSchedules();
      return true;
    },
    [fetchSchedules, roomId]
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
