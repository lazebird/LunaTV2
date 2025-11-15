/**
 * 通用验证工具函数
 */

export const validation = {
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isNotEmpty: (value: string | null | undefined): boolean => {
    return value !== null && value !== undefined && value.trim() !== '';
  },

  isValidUsername: (username: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
  },

  isValidPassword: (password: string): boolean => {
    return password.length >= 6;
  },

  isValidPort: (port: number): boolean => {
    return port > 0 && port <= 65535;
  },

  isValidIP: (ip: string): boolean => {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
      ip.split('.').every(num => parseInt(num) <= 255);
  },
};

export function validateRequired(
  value: any,
  fieldName: string
): string | null {
  if (!validation.isNotEmpty(value)) {
    return `${fieldName}不能为空`;
  }
  return null;
}

export function validateUrl(url: string, fieldName: string): string | null {
  if (!validation.isNotEmpty(url)) {
    return `${fieldName}不能为空`;
  }
  if (!validation.isValidUrl(url)) {
    return `${fieldName}格式不正确`;
  }
  return null;
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Partial<Record<keyof T, (value: any) => string | null>>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, validator] of Object.entries(rules)) {
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}
