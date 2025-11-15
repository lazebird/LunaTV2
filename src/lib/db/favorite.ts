export interface Favorite {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  source: string;
  addedAt: string;
}

export const createFavorite = (vodId: string, vodName: string, source: string, pic?: string, remarks?: string): Favorite => ({
  vod_id: vodId,
  vod_name: vodName,
  vod_pic: pic,
  vod_remarks: remarks,
  source,
  addedAt: new Date().toISOString(),
});

export const isFavorited = (favorites: Favorite[], vodId: string): boolean => {
  return favorites.some(f => f.vod_id === vodId);
};
