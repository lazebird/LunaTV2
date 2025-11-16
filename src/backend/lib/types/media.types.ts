/**
 * 共享媒体类型定义
 */

export interface PlayRecord {
  title: string;
  source_name: string;
  cover: string;
  year: string;
  index: number;
  total_episodes: number;
  play_time: number;
  total_time: number;
  save_time: number;
  search_title: string;
  remarks?: string;
}

export interface Favorite {
  source_name: string;
  total_episodes: number;
  title: string;
  year: string;
  cover: string;
  save_time: number;
  search_title: string;
  origin?: 'vod' | 'live' | 'shortdrama';
  releaseDate?: string;
  remarks?: string;
}

export interface VideoSource {
  name: string;
  api: string;
  enabled: boolean;
  order: number;
}
