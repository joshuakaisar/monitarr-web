export type SonarrSeries = {
  id: number;
  title: string;
  statistics?: {
    episodeCount?: number;
    episodeFileCount?: number;
    sizeOnDisk?: number;
    totalEpisodeCount?: number;
  };
};

export type SonarrWantedResponse = {
  totalRecords: number;
  records: { id: number; title: string }[];
};

export type SonarrHistoryRecord = {
  id: number;
  sourceTitle: string;
  eventType: string;
  date: string;
  quality?: { quality?: { name?: string } };
  series?: { title?: string };
  episode?: { title?: string; seasonNumber?: number; episodeNumber?: number };
  data?: {
    indexer?: string;
    releaseTitle?: string;
    size?: string;
  };
};

export type SonarrHistoryResponse = {
  records: SonarrHistoryRecord[];
  totalRecords: number;
};
