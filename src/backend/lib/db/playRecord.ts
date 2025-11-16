export interface PlayRecord {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  source: string;
  episode: number;
  episodeName?: string;
  progress: number;
  duration: number;
  lastPlayedAt: string;
}

export const createPlayRecord = (
  vodId: string,
  vodName: string,
  source: string,
  episode: number,
  progress: number,
  duration: number,
  pic?: string,
  episodeName?: string
): PlayRecord => ({
  vod_id: vodId,
  vod_name: vodName,
  vod_pic: pic,
  source,
  episode,
  episodeName,
  progress,
  duration,
  lastPlayedAt: new Date().toISOString(),
});

export const shouldSaveProgress = (progress: number, duration: number): boolean => {
  return progress > 10 && progress < duration - 30;
};
