export interface VideoInfo {
  vod_id: string;
  vod_name: string;
  vod_pic?: string;
  vod_remarks?: string;
  vod_play_url?: string;
  type_name?: string;
}

export interface Episode {
  name: string;
  url: string;
  index: number;
}

export interface PlaySource {
  name: string;
  episodes: Episode[];
}
