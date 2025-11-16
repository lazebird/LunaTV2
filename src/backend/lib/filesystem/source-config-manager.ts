/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import path from 'path';
import { AdminConfig } from '../admin.types';

/**
 * 源配置文件管理器
 * 负责处理源配置文件的读写操作
 */
export class SourceConfigManager {
  private fileOps: any;
  private adminConfigPath: string;

  constructor(fileOps: any, adminConfigPath: string) {
    this.fileOps = fileOps;
    this.adminConfigPath = adminConfigPath;
  }

  /**
   * 获取源配置文件路径
   */
  private getSourceConfigPath(relativePath: string): string {
    return path.isAbsolute(relativePath)
      ? relativePath
      : path.join(path.dirname(this.adminConfigPath), relativePath);
  }

  /**
   * 从源配置文件加载数据
   */
  async loadSourceConfig(sourceConfigFile: string): Promise<any[]> {
    try {
      const sourceConfigPath = this.getSourceConfigPath(sourceConfigFile);
      const sources = await this.fileOps.readJsonFile(sourceConfigPath) as any[];
      return sources || [];
    } catch (error) {
      console.error('加载源配置文件失败:', error);
      return [];
    }
  }

  /**
   * 保存源配置到文件
   */
  async saveSourceConfig(sourceConfigFile: string, sources: any[]): Promise<void> {
    const sourceConfigPath = this.getSourceConfigPath(sourceConfigFile);
    await this.fileOps.writeJsonFile(sourceConfigPath, sources);
    console.log(`源配置已保存到文件: ${sourceConfigPath}`);
  }

  /**
   * 从配置数据中提取源配置
   */
  extractSourceConfigFromConfigData(configData: any): any[] {
    const sourceSources: any[] = [];

    // 从 api_site 中提取源配置
    if (configData.api_site) {
      Object.entries(configData.api_site).forEach(([key, site]: [string, any]) => {
        sourceSources.push({
          key,
          name: site.name || key,
          api: site.api,
          detail: site.detail || '',
          from: 'config',
          disabled: false
        });
      });
    }

    // 从 lives 中提取直播源配置
    if (configData.lives) {
      Object.entries(configData.lives).forEach(([key, live]: [string, any]) => {
        sourceSources.push({
          key: `live_${key}`,
          name: live.name || key,
          api: live.url,
          detail: live.epg || '',
          from: 'live',
          disabled: false
        });
      });
    }

    return sourceSources;
  }

  /**
   * 从源配置文件中删除指定的源
   */
  async removeSources(sourceConfigFile: string, keys: string[]): Promise<boolean> {
    try {
      const sources = await this.loadSourceConfig(sourceConfigFile);
      const initialLength = sources.length;
      
      // 删除指定的源
      for (const key of keys) {
        const sourceIndex = sources.findIndex((s: any) => s.key === key);
        if (sourceIndex !== -1) {
          sources.splice(sourceIndex, 1);
        }
      }
      
      if (sources.length < initialLength) {
        await this.saveSourceConfig(sourceConfigFile, sources);
        console.log(`已从源配置文件删除 ${initialLength - sources.length} 个源`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('从源配置文件删除源失败:', error);
      return false;
    }
  }
}