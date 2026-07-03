export type Preset = {
  id: string;
  type: "bonus" | "deduct";
  label: string;
  points: number;
  requires_review: boolean;
  daily_limit: number | null;
  active: boolean;
  created_at: string;
};

export type Reward = {
  id: string;
  icon: string | null;
  name: string;
  cost: number;
  market_price: number | null;
  active: boolean;
  created_at: string;
};

export type Entry = {
  id: string;
  created_at: string;
  actor: "gf" | "admin";
  // DB 的 check constraint 仍允許 'care'（歷史資料相容），前端已無建立入口
  kind: "bonus" | "deduct" | "redeem" | "proposal";
  label: string;
  points: number;
  status: "approved" | "pending" | "rejected";
  photo_path: string | null;
  note: string | null;
  reward_id: string | null;
  fulfilled: boolean | null;
  reviewed_at: string | null;
};

export type Wish = {
  id: string;
  name: string;
  url: string | null;
  note: string | null;
  status: "open" | "added" | "rejected";
  created_at: string;
};

export type DataPayload = {
  balance: number;
  entries: Entry[];
  presets: Preset[];
  rewards: Reward[];
  wishes: Wish[];
  todayCounts: Record<string, number>;
  isAdmin: boolean;
};
