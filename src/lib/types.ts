export type Dream = {
  id: string;
  title: string;
  body: string;
  archived: boolean;
  created_at: string;
};

export type Goal = {
  id: string;
  dream_id: string | null;
  title: string;
  done_when: string;
  target: number | null;
  current: number;
  unit: string;
  quarter: string;
  archived: boolean;
  created_at: string;
  progress_updated_at: string;
};

export type Task = {
  id: string;
  goal_id: string | null;
  title: string;
  status: "open" | "done";
  due: string | null;
  focus: boolean;
  created_at: string;
  completed_at: string | null;
};

export type InboxItem = { id: string; text: string; created_at: string };

export type JournalEntry = {
  id: string;
  entry_date: string;
  entry: string;
  wins: string;
  friction: string;
  updated_at: string;
};

export type Rule = {
  id: string;
  text: string;
  origin: string;
  active: boolean;
  created_at: string;
};

export type Review = {
  id: string;
  week_of: string;
  notes: string;
  completed_count: number;
  created_at: string;
};

export type DriftState = "ok" | "warn" | "bad";
