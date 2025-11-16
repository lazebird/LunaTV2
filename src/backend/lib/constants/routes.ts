/**
 * 共享路由常量
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
  SEARCH: '/search',
  PLAY: '/play',
  LIVE: '/live',
  DOUBAN: '/douban',
  SHORTDRAMA: '/shortdrama',
  RELEASE_CALENDAR: '/release-calendar',
  PLAY_STATS: '/play-stats',
  SOURCE_BROWSER: '/source-browser',
  SOURCE_TEST: '/source-test',
  TVBOX: '/tvbox',
} as const;

export const API_ROUTES = {
  LOGIN: '/api/login',
  LOGOUT: '/api/logout',
  REGISTER: '/api/register',
  SEARCH: '/api/search',
  FAVORITES: '/api/favorites',
  PLAYRECORDS: '/api/playrecords',
  DOUBAN: '/api/douban',
  YOUTUBE: '/api/youtube',
  LIVE: '/api/live',
  ADMIN: '/api/admin',
} as const;
