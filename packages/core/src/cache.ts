// import { existsSync, readFileSync, writeFileSync } from "fs";
// import { statSync, mkdirSync } from "fs";
// import { join } from "path";

// const CACHE_DIR_PATH = join(process.cwd(), ".cache");
// const CACHE_FILE_PATH = join(CACHE_DIR_PATH, "dependency-cache.json");

// export class CacheManager {
//   private cache: Record<string, any> = {};

//   constructor() {
//     // 移除同步的缓存加载
//   }

//   // 异步加载缓存数据
//   public async loadCache() {
//     if (existsSync(CACHE_FILE_PATH)) {
//       this.cache = JSON.parse(readFileSync(CACHE_FILE_PATH, "utf-8"));
//     }
//   }

//   // 保存缓存数据
//   private async saveCache() {
//     if (!existsSync(CACHE_DIR_PATH)) {
//       mkdirSync(CACHE_DIR_PATH);
//     }
//     writeFileSync(
//       CACHE_FILE_PATH,
//       JSON.stringify(this.cache, null, 2),
//       "utf-8"
//     );
//   }

//   // 更新缓存
//   public async updateCache(filePath: string, dependencies: any, depth: number) {
//     const stats = statSync(filePath);
//     this.cache[filePath] = { mtime: stats.mtimeMs, dependencies, depth }; // 添加 depth 属性
//     await this.saveCache();
//   }

//   // 检查缓存是否过期
//   public async isUpToDate(filePath: string, depth: number): Promise<boolean> {
//     const stats = statSync(filePath);
//     const cacheEntry = this.cache[filePath];
//     if (
//       !cacheEntry ||
//       stats.mtimeMs !== cacheEntry.mtime ||
//       cacheEntry.depth !== depth
//     ) {
//       return false;
//     }
//     return true;
//   }

//   // 获取缓存的依赖数据
//   public async getDependencies(filePath: string): Promise<any> {
//     return this.cache[filePath]?.dependencies;
//   }
// }

// // 工厂函数创建 CacheManager 实例
// export const createCacheManager = async (): Promise<CacheManager> => {
//   const cacheManager = new CacheManager();
//   await cacheManager.loadCache(); // 加载缓存
//   return cacheManager;
// };
// cache.ts
import { existsSync, readFileSync, writeFileSync } from "fs";
import { statSync, mkdirSync } from "fs";
import { join } from "path";

const CACHE_DIR_PATH = join(process.cwd(), ".cache");
const CACHE_FILE_PATH = join(CACHE_DIR_PATH, "dependency-cache.json");

export class CacheManager {
  private cache: Record<string, any> = {};

  constructor() {}

  // 异步加载缓存数据
  public async loadCache() {
    if (existsSync(CACHE_FILE_PATH)) {
      this.cache = JSON.parse(readFileSync(CACHE_FILE_PATH, "utf-8"));
    }
  }

  // 保存缓存数据
  private async saveCache() {
    if (!existsSync(CACHE_DIR_PATH)) {
      mkdirSync(CACHE_DIR_PATH);
    }
    writeFileSync(
      CACHE_FILE_PATH,
      JSON.stringify(this.cache, null, 2),
      "utf-8"
    );
  }

  // 更新缓存，并增加对哈希值的支持
  public async updateCache(
    filePath: string,
    dependencies: any,
    depth: number,
    hash: string
  ) {
    const stats = statSync(filePath);
    this.cache[filePath] = {
      mtime: stats.mtimeMs,
      dependencies,
      depth,
      hash, // 添加哈希值
    };
    await this.saveCache();
  }

  // 检查缓存是否过期
  public async isUpToDate(
    filePath: string,
    depth: number,
    hash: string
  ): Promise<boolean> {
    const stats = statSync(filePath);
    const cacheEntry = this.cache[filePath];
    if (
      !cacheEntry ||
      stats.mtimeMs !== cacheEntry.mtime ||
      cacheEntry.depth !== depth ||
      cacheEntry.hash !== hash // 新增哈希检查
    ) {
      return false;
    }
    return true;
  }

  // 获取缓存的依赖数据
  public async getDependencies(filePath: string): Promise<any> {
    return this.cache[filePath]?.dependencies;
  }
}

// 工厂函数创建 CacheManager 实例
export const createCacheManager = async (): Promise<CacheManager> => {
  const cacheManager = new CacheManager();
  await cacheManager.loadCache(); // 加载缓存
  return cacheManager;
};
