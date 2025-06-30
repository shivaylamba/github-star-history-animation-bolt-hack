export interface StarHistoryData {
  repo: string;
  totalStars: number;
  history: StarHistoryPoint[];
  description: string;
  language: string;
  createdAt: string;
}

export interface StarHistoryPoint {
  date: string;
  stars: number;
}

export interface StarRecord {
  date: string;
  count: number;
}

export type ChartMode = "Date" | "Timeline";

export interface XYData {
  label: string;
  logo: string;
  data: Array<{
    x: Date | number;
    y: number;
  }>;
}

export interface XYChartData {
  datasets: XYData[];
}

export interface RepoStarData {
  repo: string;
  starRecords: StarRecord[];
}