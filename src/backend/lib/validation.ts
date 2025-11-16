/**
 * 通用表单验证工具
 */

export interface ValidationRule<T = any> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * 验证单个字段
 */
export function validateField<T>(
  value: T,
  rules: ValidationRule<T>
): string | null {
  // 必填验证
  if (rules.required && (value === null || value === undefined || value === '')) {
    return rules.message || '此字段为必填项';
  }

  // 如果值为空且不是必填，跳过其他验证
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null;
  }

  // 字符串长度验证
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      return rules.message || `最少需要 ${rules.minLength} 个字符`;
    }
    
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      return rules.message || `最多允许 ${rules.maxLength} 个字符`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || '格式不正确';
    }
  }

  // 数字范围验证
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return rules.message || `不能小于 ${rules.min}`;
    }
    
    if (rules.max !== undefined && value > rules.max) {
      return rules.message || `不能大于 ${rules.max}`;
    }
  }

  // 自定义验证
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
}

/**
 * 验证表单对象
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Partial<Record<keyof T, ValidationRule>>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    if (rule) {
      const error = validateField(data[field], rule);
      if (error) {
        errors[field] = error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * 常用验证规则
 */
export const CommonRules = {
  required: (message?: string): ValidationRule => ({
    required: true,
    message: message || '此字段为必填项',
  }),

  email: (message?: string): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: message || '请输入有效的邮箱地址',
  }),

  url: (message?: string): ValidationRule => ({
    pattern: /^https?:\/\/.+/,
    message: message || '请输入有效的URL',
  }),

  username: (message?: string): ValidationRule => ({
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: message || '用户名只能包含字母、数字和下划线，长度3-20位',
  }),

  password: (message?: string): ValidationRule => ({
    minLength: 6,
    maxLength: 50,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: message || '密码需包含大小写字母和数字，长度6-50位',
  }),

  phoneNumber: (message?: string): ValidationRule => ({
    pattern: /^1[3-9]\d{9}$/,
    message: message || '请输入有效的手机号码',
  }),

  id: (message?: string): ValidationRule => ({
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: message || 'ID只能包含字母、数字、下划线和连字符',
  }),

  apiKey: (message?: string): ValidationRule => ({
    minLength: 10,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: message || 'API密钥格式不正确',
  }),
};

/**
 * 动态验证器生成器
 */
export function createValidator<T extends Record<string, any>>(rules: Partial<Record<keyof T, ValidationRule>>) {
  return (data: T): ValidationResult => validateForm(data, rules);
}

/**
 * 异步验证器
 */
export async function validateFieldAsync<T>(
  value: T,
  rules: ValidationRule<T> & { async?: (value: T) => Promise<string | null> }
): Promise<string | null> {
  // 先进行同步验证
  const syncError = validateField(value, rules);
  if (syncError) {
    return syncError;
  }

  // 然后进行异步验证
  if (rules.async) {
    return await rules.async(value);
  }

  return null;
}

/**
 * 条件验证
 */
export function validateIf<T>(
  condition: (data: T) => boolean,
  rules: ValidationRule<T>
): ValidationRule<T> {
  return {
    ...rules,
    custom: (value: T) => {
      // 这里需要获取整个数据对象，但当前设计只传递了单个值
      // 在实际使用时，可能需要调整设计
      return null;
    },
  };
}

/**
 * 验证器组合
 */
export function combineValidators<T>(...validators: Array<(value: T) => string | null>) {
  return (value: T): string | null => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
}