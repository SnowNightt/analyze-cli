import { describe, it, expect, vi } from "vitest";
import { analyzeDependencies } from "../src/analyze"; // 根据实际路径调整
import { createCacheManager } from "../src/cache";
import { getProjectInfo, getDependencyTree } from "../src/utils";
import { logger } from "@analyze-cli/shared";

vi.mock("../src/cache", () => ({
  createCacheManager: vi.fn(),
}));

vi.mock("../src/utils", () => ({
  getProjectInfo: vi.fn(),
  getDependencyTree: vi.fn(),
}));

vi.mock("@analyze-cli/shared", () => ({
  logger: {
    info: vi.fn(),
    define: vi.fn(),
  },
}));

describe("analyzeDependencies", () => {
  it("should return cached dependencies if cache is up to date", async () => {
    const mockDir = "/mocked/dir";
    const mockDepth = 1;
    const mockCacheManager = {
      isUpToDate: vi.fn().mockResolvedValue(true),
      getDependencies: vi.fn().mockResolvedValue({
        /* mock cached data */
      }),
    };

    (createCacheManager as vi.Mock).mockResolvedValue(mockCacheManager);

    const result = await analyzeDependencies(mockDir, mockDepth);

    expect(mockCacheManager.isUpToDate).toHaveBeenCalledWith(
      mockDir,
      mockDepth
    );
    expect(mockCacheManager.getDependencies).toHaveBeenCalledWith(mockDir);
    expect(result).toEqual({
      /* mock cached data */
    });
  });

  it("should analyze dependencies when cache is not up to date", async () => {
    const mockDir = "/mocked/dir";
    const mockDepth = 2;
    const mockCacheManager = {
      isUpToDate: vi.fn().mockResolvedValue(false),
      updateCache: vi.fn(),
    };
    const mockProjectInfo = {
      name: "mocked-project",
      version: "1.0.0",
      dependencies: { dep1: "1.0.0" },
      devDependencies: { devDep1: "1.0.0" },
    };

    (createCacheManager as vi.Mock).mockResolvedValue(mockCacheManager);
    (getProjectInfo as vi.Mock).mockResolvedValue(mockProjectInfo);

    // Mocking the return value of getDependencyTree for each dependency
    (getDependencyTree as vi.Mock).mockResolvedValueOnce({
      /* mock dep1 tree */
    });
    (getDependencyTree as vi.Mock).mockResolvedValueOnce({
      /* mock devDep1 tree */
    });

    const result = await analyzeDependencies(mockDir, mockDepth);

    expect(mockCacheManager.isUpToDate).toHaveBeenCalledWith(
      mockDir,
      mockDepth
    );
    expect(getProjectInfo).toHaveBeenCalledWith(mockDir);
    expect(getDependencyTree).toHaveBeenCalledTimes(2); // Check if it was called for both dependencies
    expect(getDependencyTree).toHaveBeenCalledWith("dep1", 1, mockDepth);
    expect(getDependencyTree).toHaveBeenCalledWith("devDep1", 1, mockDepth);
    expect(mockCacheManager.updateCache).toHaveBeenCalledWith(
      mockDir,
      expect.any(Object),
      mockDepth
    );

    expect(result).toEqual({
      name: "mocked-project",
      version: "1.0.0",
      packages: {
        dep1: {
          version: "1.0.0",
          type: "dependency",
          packages: {
            /* mock dep1 tree */
          },
        },
        devDep1: {
          version: "1.0.0",
          type: "devDependency",
          packages: {
            /* mock devDep1 tree */
          },
        },
      },
    });

    // Check if logger.info was called during dependency analysis
    expect(logger.info).toHaveBeenCalledWith("从缓存中加载依赖数据...\n");
  });
});
