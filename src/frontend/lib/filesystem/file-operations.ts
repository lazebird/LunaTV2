/* eslint-disable no-console, @typescript-eslint/no-explicit-any */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * 文件系统操作工具类
 * 提供统一的文件读写、目录管理等基础操作
 */
export class FileOperations {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  /**
   * 初始化目录结构
   */
  async initDirectories(directories: string[]): Promise<void> {
    await Promise.all(
      directories.map(dir => this.ensureDirectory(path.join(this.dataDir, dir)))
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FileOperations] 目录初始化完成: ${directories.join(', ')}`);
    }
  }

  /**
   * 确保目录存在
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`[FileOperations] 创建目录失败: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * 读取 JSON 文件
   */
  async readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const data = await fs.readFile(filePath, 'utf-8');
      const result = JSON.parse(data);
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FileOperations] 读取文件: ${path.relative(this.dataDir, filePath)} (${duration}ms)`);
      }
      
      return result;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.error(`[FileOperations] 读取文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 写入 JSON 文件
   */
  async writeJsonFile(filePath: string, data: any): Promise<void> {
    try {
      const startTime = Date.now();
      const dir = path.dirname(filePath);
      await this.ensureDirectory(dir);
      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, jsonString, 'utf-8');
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FileOperations] 写入文件: ${path.relative(this.dataDir, filePath)} (${duration}ms, ${jsonString.length} bytes)`);
      }
    } catch (error) {
      console.error(`[FileOperations] 写入文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FileOperations] 删除文件: ${path.relative(this.dataDir, filePath)}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`[FileOperations] 删除文件失败: ${filePath}`, error);
        throw error;
      }
    }
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取目录下的所有条目
   */
  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * 递归删除目录
   */
  async removeDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FileOperations] 删除目录: ${path.relative(this.dataDir, dirPath)}`);
      }
    } catch (error) {
      console.error(`[FileOperations] 删除目录失败: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * 复制文件或目录
   */
  async copyFile(source: string, destination: string): Promise<void> {
    try {
      await this.ensureDirectory(path.dirname(destination));
      await fs.copyFile(source, destination);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[FileOperations] 复制文件: ${path.relative(this.dataDir, source)} -> ${path.relative(this.dataDir, destination)}`);
      }
    } catch (error) {
      console.error(`[FileOperations] 复制文件失败: ${source} -> ${destination}`, error);
      throw error;
    }
  }

  /**
   * 获取文件状态
   */
  async getFileStats(filePath: string): Promise<any | null> {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * 计算目录大小
   */
  async calculateDirectorySize(dirPath: string): Promise<number> {
    let size = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          size += await this.calculateDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }
    } catch (error) {
      // 忽略无法访问的目录
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[FileOperations] 无法计算目录大小: ${dirPath}`, error);
      }
    }
    
    return size;
  }

  /**
   * 批量操作
   */
  async batchOperation<T>(
    operations: Array<() => Promise<T>>,
    options?: { concurrency?: number; stopOnError?: boolean }
  ): Promise<T[]> {
    const concurrency = options?.concurrency || 5;
    const stopOnError = options?.stopOnError !== false;
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      
      try {
        const batchResults = await Promise.all(batch.map(op => op()));
        results.push(...batchResults);
      } catch (error) {
        if (stopOnError) {
          throw error;
        }
        console.error(`[FileOperations] 批量操作中的部分操作失败:`, error);
      }
    }
    
    return results;
  }

  /**
   * 清理目录中的过期文件
   */
  async cleanExpiredFiles(
    dirPath: string,
    isExpired: (fileName: string, fileData: any) => boolean
  ): Promise<number> {
    let cleanedCount = 0;
    
    try {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const filePath = path.join(dirPath, entry);
        const stats = await this.getFileStats(filePath);
        
        if (stats && stats.isFile()) {
          try {
            const data = await this.readJsonFile<{expireTime?: number}>(filePath);
            if (data && isExpired(entry, data)) {
              await this.deleteFile(filePath);
              cleanedCount++;
            }
          } catch (error) {
            // 忽略无法解析的文件
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`[FileOperations] 清理过期文件失败: ${dirPath}`, error);
      }
    }
    
    return cleanedCount;
  }

  /**
   * 备份数据
   */
  async backupData(sourceDir: string, backupName?: string): Promise<string> {
    const timestamp = backupName || `backup_${Date.now()}`;
    const backupDir = path.join(this.dataDir, timestamp);
    
    try {
      await this.copyDirectory(sourceDir, backupDir);
      console.log(`[FileOperations] 数据备份完成: ${backupDir}`);
      return backupDir;
    } catch (error) {
      console.error(`[FileOperations] 数据备份失败:`, error);
      throw error;
    }
  }

  /**
   * 递归复制目录
   */
  private async copyDirectory(source: string, destination: string): Promise<void> {
    await this.ensureDirectory(destination);
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await this.copyFile(sourcePath, destPath);
      }
    }
  }

  /**
   * 获取相对路径
   */
  getRelativePath(filePath: string): string {
    return path.relative(this.dataDir, filePath);
  }

  /**
   * 获取绝对路径
   */
  getAbsolutePath(relativePath: string): string {
    return path.join(this.dataDir, relativePath);
  }
}