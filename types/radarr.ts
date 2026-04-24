export type RadarrMovie = {
  id: number;
  title: string;
  hasFile: boolean;
  sizeOnDisk?: number;
};

export type RadarrWantedResponse = {
  totalRecords: number;
  records: { id: number; title: string }[];
};

export type RadarrHistoryRecord = {
  id: number;
  sourceTitle: string;
  eventType: string;
  date: string;
  quality?: { quality?: { name?: string } };
  movie?: { title?: string };
};

export type RadarrHistoryResponse = {
  records: RadarrHistoryRecord[];
  totalRecords: number;
};
