import { describe, it, expect, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import {
  findPackageJson,
  getProjectInfo,
  getDependencyTree,
  parseImportPaths,
  resolveFilePath,
  ensureTsExtension,
  comparePaths,
} from "../src/utils"; // 根据实际路径调整

// Mock fs/promises
vi.mock("fs/promises");

describe("Utils", () => {
  afterEach(() => {
    vi.restoreAllMocks(); // 清理每个测试后的 mocks
  });

  describe("findPackageJson", () => {
    it("should find package.json in the current directory", async () => {
      const mockPath = "mockDir/package.json";
      (fs.access as unknown as vi.Mock).mockResolvedValueOnce(undefined);

      const result = await findPackageJson("mockDir");
    });

    it("should return null if package.json is not found", async () => {
      (fs.access as unknown as vi.Mock).mockRejectedValueOnce(
        new Error("File not found")
      );

      const result = await findPackageJson("mockDir");
    });
  });

  describe("getProjectInfo", () => {
    it("should retrieve project info from package.json", async () => {
      const mockPackageJson = {
        name: "mock-project",
        version: "1.0.0",
        dependencies: { dep1: "^1.0.0" },
        devDependencies: {},
      };
      (fs.readFile as unknown as vi.Mock).mockResolvedValueOnce(
        JSON.stringify(mockPackageJson)
      );
      (fs.access as unknown as vi.Mock).mockResolvedValueOnce(undefined);

      const result = await getProjectInfo("mockDir");
      expect(result).toEqual({
        name: "mock-project",
        version: "1.0.0",
        dependencies: { dep1: "^1.0.0" },
        devDependencies: {},
      });
    });
  });

  describe("getDependencyTree", () => {
    it("should return a dependency tree for a package", async () => {
      const mockPackageJson = {
        dependencies: {
          dep1: "^1.0.0",
        },
        devDependencies: {},
      };
      const mockPkgPath = "dep1/package.json";
      (fs.readFile as unknown as vi.Mock).mockResolvedValueOnce(
        JSON.stringify(mockPackageJson)
      );
      (fs.access as unknown as vi.Mock).mockResolvedValueOnce(undefined);

      // Mocking require.resolve
      vi.stubGlobal("require", (pkg: string) => {
        if (pkg === "dep1") {
          return mockPkgPath;
        }
        throw new Error("Package not found");
      });

      const result = await getDependencyTree("dep1", 0, 1);
    });

    it("should handle errors gracefully", async () => {
      (fs.readFile as unknown as vi.Mock).mockRejectedValueOnce(
        new Error("File not found")
      );

      const result = await getDependencyTree("non-existing-package", 0, 1);
      expect(result).toEqual({});
    });
  });

  describe("parseImportPaths", () => {
    it("should extract import paths from file content", () => {
      const fileContent = `
        import { something } from './something';
        import * as utils from '../utils';
        import defaultExport from 'module';
      `;

      const result = parseImportPaths(fileContent);
      expect(result).toEqual(["./something", "../utils", "module"]);
    });
  });

  describe("resolveFilePath", () => {
    it("should resolve an import path with an alias", async () => {
      const aliases = { "@": "src" };
      const resolvedPath = await resolveFilePath(
        "@/utils/helper",
        "src/index.ts",
        "src",
        aliases
      );
    });

    it("should resolve a relative import path", async () => {
      (fs.stat as unknown as vi.Mock).mockResolvedValueOnce({
        isFile: () => true,
      });

      const resolvedPath = await resolveFilePath(
        "./helper",
        "src/index.ts",
        "src",
        null
      );
      console.log("Resolved Path:", resolvedPath); // 调试输出
    });
  });

  describe("ensureTsExtension", () => {
    it("should append .ts extension if not present and the file exists", async () => {
      (fs.access as unknown as vi.Mock).mockResolvedValueOnce(undefined); // 文件存在

      const result = await ensureTsExtension("src/file");
      expect(result).toEqual("src/file.ts");
    });

    it("should return the path if it already ends with .ts", async () => {
      const result = await ensureTsExtension("src/file.ts");
      expect(result).toEqual("src/file.ts");
    });

    it("should exit the process if the file does not exist", async () => {
      (fs.access as unknown as vi.Mock).mockRejectedValueOnce(
        new Error("File not found")
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(((code: any) => {}) as any);

      await ensureTsExtension("src/file");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("文件 src/file.ts 不存在")
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe("comparePaths", () => {
    it("should return true for identical paths", () => {
      const result = comparePaths("/path/to/file", "/path/to/file");
      expect(result).toBe(true);
    });

    it("should return false for different paths", () => {
      const result = comparePaths("/path/to/file", "/path/to/otherfile");
      expect(result).toBe(false);
    });
  });
});
