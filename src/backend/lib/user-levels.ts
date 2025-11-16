// 用户等级系统
export interface UserLevel {
  level: number;
  name: string;
  icon: string;
  minLogins: number;
  maxLogins: number;
  description: string;
  gradient: string;
}

export const USER_LEVELS: UserLevel[] = [
  { level: 1, name: "新星观众", icon: "🌟", minLogins: 1, maxLogins: 9, description: "刚刚开启观影之旅", gradient: "from-slate-400 to-slate-600" },
  { level: 2, name: "常客影迷", icon: "🎬", minLogins: 10, maxLogins: 49, description: "热爱电影的观众", gradient: "from-blue-400 to-blue-600" },
  { level: 3, name: "资深观众", icon: "📺", minLogins: 50, maxLogins: 199, description: "对剧集有独特品味", gradient: "from-emerald-400 to-emerald-600" },
  { level: 4, name: "影院达人", icon: "🎭", minLogins: 200, maxLogins: 499, description: "深度电影爱好者", gradient: "from-violet-400 to-violet-600" },
  { level: 5, name: "观影专家", icon: "🏆", minLogins: 500, maxLogins: 999, description: "拥有丰富观影经验", gradient: "from-amber-400 to-amber-600" },
  { level: 6, name: "传奇影神", icon: "👑", minLogins: 1000, maxLogins: 2999, description: "影视界的传奇人物", gradient: "from-red-400 via-red-500 to-red-600" },
  { level: 7, name: "殿堂影帝", icon: "💎", minLogins: 3000, maxLogins: 9999, description: "影视殿堂的至尊", gradient: "from-pink-400 via-pink-500 to-pink-600" },
  { level: 8, name: "永恒之光", icon: "✨", minLogins: 10000, maxLogins: Infinity, description: "永恒闪耀的观影之光", gradient: "from-indigo-400 via-purple-500 to-pink-500" }
];

export function calculateUserLevel(loginCount: number): UserLevel {
  // 0次登录的特殊处理
  if (loginCount === 0) {
    return {
      level: 0,
      name: "待激活",
      icon: "💤",
      minLogins: 0,
      maxLogins: 0,
      description: "尚未开始观影之旅",
      gradient: "from-gray-400 to-gray-500"
    };
  }

  for (const level of USER_LEVELS) {
    if (loginCount >= level.minLogins && loginCount <= level.maxLogins) {
      return level;
    }
  }

  // 如果超出最大等级，返回最高等级
  return USER_LEVELS[USER_LEVELS.length - 1];
}

export function getLevelProgress(loginCount: number): {
  current: UserLevel;
  next: UserLevel | null;
  progress: number;
} {
  const current = calculateUserLevel(loginCount);
  
  // 如果是最高等级或0级，没有下一级
  if (current.level === 0 || current.level === USER_LEVELS.length) {
    return {
      current,
      next: null,
      progress: 0,
    };
  }
  
  const next = USER_LEVELS.find(level => level.level === current.level + 1) || null;
  if (!next) {
    return {
      current,
      next: null,
      progress: 0,
    };
  }
  
  const progress = ((loginCount - current.minLogins) / (next.minLogins - current.minLogins)) * 100;
  
  return {
    current,
    next,
    progress: Math.min(Math.max(progress, 0), 100),
  };
}

export function getLevelBadge(level: UserLevel): {
  text: string;
  className: string;
} {
  return {
    text: `${level.icon} Lv.${level.level}`,
    className: `bg-gradient-to-r ${level.gradient} text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg`,
  };
}