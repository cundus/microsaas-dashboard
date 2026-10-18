import type { Database } from "@/types/database";
import type { RevenueRange } from "./revenue";

export type UserGrowthInterval = "day" | "week" | "month";
export type UserGrowthRange = RevenueRange & { interval: UserGrowthInterval };
export type UserGrowthPoint =
  Database["public"]["Functions"]["get_user_growth_time_series"]["Returns"][number];
