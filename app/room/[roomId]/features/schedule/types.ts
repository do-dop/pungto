export type ScheduleColor = "purple" | "teal" | "coral";

export type Schedule = {
  id: string;
  room_id: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  color: ScheduleColor | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleInput = {
  title: string;
  description?: string;
  scheduled_date: string;
  color: ScheduleColor;
};
