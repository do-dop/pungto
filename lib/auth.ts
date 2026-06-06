import { supabase } from "./supabase";

export async function ensureAnonymousUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Load auth session error:", sessionError);
  }

  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        app: "pungto",
      },
    },
  });

  if (error || !data.user) {
    throw error ?? new Error("익명 사용자 세션을 생성하지 못했습니다.");
  }

  return data.user;
}

export async function createRoomWithPassword(roomId: string, title: string, password: string) {
  const user = await ensureAnonymousUser();

  const { error } = await supabase.rpc("create_room_with_password", {
    p_room_id: roomId,
    p_title: title.trim() || "새 방",
    p_password: password,
  });

  if (error) {
    throw error;
  }

  return user;
}

export async function getRoomTitle(roomId: string) {
  const { data, error } = await supabase.rpc("get_public_room_title", {
    p_room_id: roomId,
  });

  if (error) {
    throw error;
  }

  return typeof data === "string" && data.trim() ? data : "Pungto";
}

export async function joinRoomWithPassword(
  roomId: string,
  password: string,
  displayName: string
) {
  const user = await ensureAnonymousUser();

  const { error } = await supabase.rpc("join_room_with_password", {
    p_room_id: roomId,
    p_password: password,
    p_display_name: displayName.trim(),
  });

  if (error) {
    throw error;
  }

  return user;
}
