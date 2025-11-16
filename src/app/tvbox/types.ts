export interface SecurityConfig {
  enableAuth: boolean;
  token: string;
  enableIpWhitelist: boolean;
  allowedIPs: string[];
  enableRateLimit: boolean;
  rateLimit: number;
}

export interface Source {
  key: string;
  name: string;
}

export interface DiagnosisResult {
  spider?: string;
  spiderPrivate?: boolean;
  spiderReachable?: boolean;
  spiderStatus?: number;
  spiderSizeKB?: number;
  spiderLastModified?: string;
  contentLength?: string;
  lastModified?: string;
  spider_url?: string;
  spider_md5?: string;
  spider_cached?: boolean;
  spider_real_size?: number;
  spider_tried?: number;
  spider_success?: boolean;
  spider_backup?: string;
  spider_candidates?: string[];
  status?: number;
  contentType?: string;
  hasJson?: boolean;
  receivedToken?: string;
  size?: number;
  sitesCount?: number;
  livesCount?: number;
  parsesCount?: number;
  privateApis?: number;
  configUrl?: string;
  issues?: string[];
  pass?: boolean;
}

export interface JarDiagnostic {
  jarExists: boolean;
  jarSize: number;
  jarLastModified: string;
  javaInstalled: boolean;
  javaVersion: string;
  javaHome: string;
  environment: {
    arch: string;
    platform: string;
    nodeVersion: string;
  };
  issues: string[];
  pass: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details: Record<string, any>;
  timestamp: number;
}