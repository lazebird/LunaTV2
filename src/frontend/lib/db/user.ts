export interface User {
  username: string;
  password: string;
  role: 'user' | 'admin' | 'owner';
  banned?: boolean;
  tags?: string[];
  enabledApis?: string[];
  showAdultContent?: boolean;
  tvboxToken?: string;
  tvboxEnabledSources?: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

export const createUser = (username: string, password: string, role: 'user' | 'admin' | 'owner' = 'user'): User => ({
  username,
  password,
  role,
  banned: false,
  tags: [],
  enabledApis: [],
  showAdultContent: false,
  createdAt: new Date().toISOString(),
});

export const validateUser = (user: User): boolean => {
  return !!(user.username && user.password && user.role);
};
