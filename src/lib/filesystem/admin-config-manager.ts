/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import path from 'path';
import { AdminConfig } from '../admin.types';
import { SourceConfigManager } from './source-config-manager';

/**
 * Admin配置管理器
 * 负责处理AdminConfig的读写和转换
 */
export class AdminConfigManager {
  private fileOps: any;
  private adminConfigPath: string;
  private sourceConfigManager: SourceConfigManager;

  constructor(fileOps: any, adminConfigPath: string) {
    this.fileOps = fileOps;
    this.adminConfigPath = adminConfigPath;
    this.sourceConfigManager = new SourceConfigManager(fileOps, adminConfigPath);
  }

  /**
   * 加载AdminConfig，处理源配置文件引用
   */
  async loadAdminConfig(): Promise<AdminConfig | null> {
    const rawConfig = await this.fileOps.readJsonFile<AdminConfig>(this.adminConfigPath);
    
    if (!rawConfig) {
      return null;
    }

    // 创建返回给调用者的配置对象
    const config: AdminConfig = { ...rawConfig };

    // 处理源配置文件引用 - 从独立文件加载源配置
    if ((rawConfig as any)._sourceConfigFile) {
      config.SourceConfig = await this.sourceConfigManager.loadSourceConfig(
        (rawConfig as any)._sourceConfigFile
      );
    } else {
      // 如果没有源配置文件引用，确保SourceConfig是空数组
      config.SourceConfig = config.SourceConfig || [];
    }

    // 确保ConfigFile字段存在（为了兼容接口使用者）
    if (!config.ConfigFile) {
      config.ConfigFile = '';
    }
    
    return config;
  }

  /**
   * 保存AdminConfig，清理冗余字段
   */
  async saveAdminConfig(config: AdminConfig): Promise<void> {
    const existingConfig = await this.fileOps.readJsonFile<AdminConfig>(this.adminConfigPath).catch(() => null);
    
    // 准备要保存到文件的配置对象（清理冗余字段）
    const configToSave: any = { ...config };
    
    // 删除ConfigFile和SourceConfig字段，确保admin.json文件清晰
    delete configToSave.ConfigFile;
    delete configToSave.SourceConfig;
    
    try {
      // 处理源配置保存
      await this.handleSourceConfigSaving(config, configToSave, existingConfig);
      
      // 保存清理后的admin配置
      await this.fileOps.writeJsonFile(this.adminConfigPath, configToSave);
      console.log(`管理员配置已保存，已清理冗余字段`);
      
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 处理源配置保存逻辑
   */
  private async handleSourceConfigSaving(
    config: AdminConfig, 
    configToSave: any, 
    existingConfig: AdminConfig | null
  ): Promise<void> {
    const sourceConfigFileName = 'source.json';

    if (config.ConfigFile && config.ConfigFile.trim() !== '') {
      // 如果ConfigFile不为空，说明是从config_file API传入的配置内容
      const configData = JSON.parse(config.ConfigFile);
      const sourceSources = this.sourceConfigManager.extractSourceConfigFromConfigData(configData);
      
      // 保存源配置到单独的文件
      await this.sourceConfigManager.saveSourceConfig(sourceConfigFileName, sourceSources);
      
      // 添加源配置文件引用
      configToSave._sourceConfigFile = sourceConfigFileName;
    } else if (config.SourceConfig && config.SourceConfig.length > 0) {
      // 如果SourceConfig有内容，保存到独立文件
      await this.sourceConfigManager.saveSourceConfig(sourceConfigFileName, config.SourceConfig);
      
      // 添加源配置文件引用
      configToSave._sourceConfigFile = sourceConfigFileName;
    } else if (existingConfig && (existingConfig as any)._sourceConfigFile) {
      // 如果配置为空但之前有源配置文件，保持引用不变
      configToSave._sourceConfigFile = (existingConfig as any)._sourceConfigFile;
      
      // 清空源配置文件内容
      await this.sourceConfigManager.saveSourceConfig(
        (existingConfig as any)._sourceConfigFile, 
        []
      );
      console.log(`源配置文件已清空`);
    }
  }

  /**
   * 保存订阅配置到源配置文件
   */
  async saveSubscriptionConfig(configContent: string): Promise<boolean> {
    try {
      const configData = JSON.parse(configContent);
      const sourceSources = this.sourceConfigManager.extractSourceConfigFromConfigData(configData);
      
      const existingConfig = await this.fileOps.readJsonFile<AdminConfig>(this.adminConfigPath).catch(() => null);
      
      if (existingConfig && (existingConfig as any)._sourceConfigFile) {
        await this.sourceConfigManager.saveSourceConfig(
          (existingConfig as any)._sourceConfigFile, 
          sourceSources
        );
        console.log(`订阅配置已保存到源配置文件`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('保存订阅配置到源配置文件失败:', error);
      return false;
    }
  }

  /**
   * 从源配置文件中删除指定的源
   */
  async removeSources(keys: string[]): Promise<boolean> {
    const existingConfig = await this.fileOps.readJsonFile<AdminConfig>(this.adminConfigPath).catch(() => null);
    
    if (!existingConfig || !(existingConfig as any)._sourceConfigFile) {
      return false;
    }
    
    return await this.sourceConfigManager.removeSources(
      (existingConfig as any)._sourceConfigFile, 
      keys
    );
  }
}