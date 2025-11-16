// 直播频道接口
export interface LiveChannel {
  id: string;
  tvgId: string;
  name: string;
  logo: string;
  group: string;
  url: string;
}

// 直播源接口
export interface LiveSource {
  id: string;
  name: string;
  url: string;
  groupTitle?: string;
  group?: string;
  isActive?: boolean;
  logo?: string;
  epgUrl?: string;
}

// EPG节目接口
export interface EpgProgram {
  id: string;
  title: string;
  start: number;
  stop: number;
  category?: string;
  description?: string;
  icon?: string;
  channel: string;
}

// 播放状态接口
export interface PlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// 过滤器状态接口
export interface FilterState {
  group: string;
  search: string;
  sortBy: 'name' | 'group';
  sortOrder: 'asc' | 'desc';
}

// 用户设置接口
export interface UserSettings {
  defaultVolume: number;
  autoplay: boolean;
  lowQualityMode: boolean;
  epgEnabled: boolean;
  favoriteChannels: string[];
}