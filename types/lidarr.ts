export type LidarrArtist = {
  id: number;
  artistName: string;
  statistics?: {
    albumCount?: number;
    trackCount?: number;
    sizeOnDisk?: number;
  };
};
