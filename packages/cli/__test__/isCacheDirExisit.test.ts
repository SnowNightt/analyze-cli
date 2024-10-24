import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, mkdirSync } from "fs";
import { ensureCacheDirectoryExists } from "../src/isCacheDirExisit";
import { join } from "path";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("ensureCacheDirectoryExists", () => {
  const cacheDir = join(process.cwd(), ".cache");

  // 在每个测试用例之前重置 mocks
  beforeEach(() => {
    vi.clearAllMocks(); // 清除所有 mocks
    vi.spyOn(console, "log").mockImplementation(() => {}); // 模拟 console.log
  });

  it("should create .cache directory if it doesn't exist", () => {
    // 模拟缓存目录不存在
    (existsSync as vi.Mock).mockReturnValue(false);

    // 调用函数
    ensureCacheDirectoryExists();

    // 确保 mkdirSync 被调用以创建目录
    expect(mkdirSync).toHaveBeenCalledWith(cacheDir);
    expect(console.log).toHaveBeenCalledWith("缓存目录已创建: .cache");
  });

  it("should not create .cache directory if it exists", () => {
    // 模拟缓存目录存在
    (existsSync as vi.Mock).mockReturnValue(true);

    // 调用函数
    ensureCacheDirectoryExists();

    // 确保 mkdirSync 未被调用，因为目录已存在
    expect(mkdirSync).not.toHaveBeenCalled();
  });
});
