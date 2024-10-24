import { createCacheManager, CacheManager } from "../src/cache"; // 根据实际路径调整
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"; // 引入 vitest API
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { statSync } from "fs";
import { join } from "path";

// 模拟 fs 模块
vi.mock("fs", () => {
  return {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    statSync: vi.fn(),
  };
});

describe("CacheManager", () => {
  let cacheManager: CacheManager;
  const CACHE_DIR_PATH = join(process.cwd(), ".cache");
  const CACHE_FILE_PATH = join(CACHE_DIR_PATH, "dependency-cache.json");

  beforeEach(async () => {
    cacheManager = await createCacheManager();
    // 清空 mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should load cache from file", async () => {
    const mockCacheData = {
      "/path/to/file.ts": { mtime: 123456789, dependencies: [], depth: 1 },
    };

    (existsSync as jest.Mock).mockReturnValue(true); // 模拟文件存在
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData)); // 模拟读取文件内容

    await cacheManager.loadCache();

    expect(cacheManager.cache).toEqual(mockCacheData);
  });

  it("should not load cache if file does not exist", async () => {
    (existsSync as jest.Mock).mockReturnValue(false); // 模拟文件不存在

    await cacheManager.loadCache();

    expect(cacheManager.cache).toEqual({});
  });

  it("should save cache to file", async () => {
    cacheManager.cache = {
      "/path/to/file.ts": { mtime: 123456789, dependencies: [], depth: 1 },
    };

    (existsSync as jest.Mock).mockReturnValue(false); // 模拟目录不存在

    await cacheManager.saveCache();

    expect(mkdirSync).toHaveBeenCalledWith(CACHE_DIR_PATH); // 检查是否创建了目录
    expect(writeFileSync).toHaveBeenCalledWith(
      CACHE_FILE_PATH,
      JSON.stringify(cacheManager.cache, null, 2),
      "utf-8"
    ); // 检查是否正确保存文件
  });

  it("should update cache with new dependencies", async () => {
    const filePath = "/path/to/file.ts";
    const dependencies = ["dep1", "dep2"];
    const depth = 2;

    (statSync as jest.Mock).mockReturnValue({ mtimeMs: 123456789 }); // 模拟文件时间戳
    cacheManager.cache[filePath] = {
      mtime: 123456789,
      dependencies: [],
      depth: 1,
    }; // 预设旧缓存数据

    await cacheManager.updateCache(filePath, dependencies, depth);

    expect(cacheManager.cache[filePath]).toEqual({
      mtime: 123456789,
      dependencies,
      depth,
    });
    expect(writeFileSync).toHaveBeenCalled(); // 检查保存方法是否被调用
  });

  it("should check if cache is up to date", async () => {
    const filePath = "/path/to/file.ts";
    const depth = 2;

    (statSync as jest.Mock).mockReturnValue({ mtimeMs: 123456789 }); // 模拟文件时间戳
    cacheManager.cache[filePath] = {
      mtime: 123456789,
      dependencies: [],
      depth: 2,
    }; // 模拟缓存数据

    const result = await cacheManager.isUpToDate(filePath, depth);

    expect(result).toBe(true); // 检查是否认为缓存是最新的

    // 修改缓存以检查不匹配的情况
    cacheManager.cache[filePath].depth = 1;

    const result2 = await cacheManager.isUpToDate(filePath, depth);
    expect(result2).toBe(false); // 由于深度不匹配，应返回 false
  });

  it("should get dependencies from cache", async () => {
    const filePath = "/path/to/file.ts";
    const dependencies = ["dep1", "dep2"];
    cacheManager.cache[filePath] = { dependencies }; // 模拟缓存数据

    const result = await cacheManager.getDependencies(filePath);

    expect(result).toEqual(dependencies); // 检查返回的依赖是否正确
  });
});
