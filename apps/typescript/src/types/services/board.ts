// Board management service types

export interface BoardItem {
  id: string;
  number: number;
  title: string;
  tddPhase: string;
  criteriaProgress: string;
  url: string;
}

export interface BoardInfo {
  id: string;
  title: string;
  url: string;
  itemCount: number;
}