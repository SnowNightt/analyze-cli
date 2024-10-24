import { describe, it, expect, vi } from "vitest";
import { runCLI } from "../src/index"; // 确保引入 index.ts 中的 runCLI 函数
import { saveToJson } from "../src/output";
import { ensureCacheDirectoryExists } from "../src/isCacheDirExisit";
import {
  buildImportTree,
  printTree,
  ensureTsExtension,
  resolveTsconfigAlias,
  analyzeDependencies,
} from "@analyze-cli/core";

// Mock 依赖
vi.mock("@analyze-cli/core", () => ({
  analyzeDependencies: vi.fn(),
  resolveTsconfigAlias: vi.fn(),
  buildImportTree: vi.fn(),
  printTree: vi.fn(),
  ensureTsExtension: vi.fn(),
}));
vi.mock("../src/output", () => ({
  saveToJson: vi.fn(),
}));
vi.mock("../src/isCacheDirExisit", () => ({
  ensureCacheDirectoryExists: vi.fn(),
}));

describe("分析项目依赖命令", () => {
  it("命令执行的时候分析依赖", async () => {
    const mockAnalyze = vi.fn().mockResolvedValue({}); // 创建 mock 函数
    (analyzeDependencies as vi.Mock).mockImplementation(mockAnalyze); // 模拟实现

    await runCLI(["analyze", "some-directory"]); // 调用 CLI

    expect(mockAnalyze).toHaveBeenCalled(); // 确保分析函数被调用
  });

  it("是否调用判断缓存目录是否存在的方法", async () => {
    const mockEnsureCache = vi.fn(); // 创建 mock 函数
    (ensureCacheDirectoryExists as vi.Mock).mockImplementation(mockEnsureCache); // 模拟实现

    await runCLI(["some-directory"]); // 调用 CLI

    expect(mockEnsureCache).toHaveBeenCalled(); // 确保缓存目录检查被调用
  });

  it("当提供输出时，应该将结果保存到JSON", async () => {
    const mockSaveToJson = vi.fn(); // 创建 mock 函数
    (saveToJson as vi.Mock).mockImplementation(mockSaveToJson); // 模拟实现

    const mockResult = { data: "test" }; // 模拟结果
    (analyzeDependencies as vi.Mock).mockResolvedValue(mockResult); // 模拟分析结果

    await runCLI(["analyze", "some-directory", "--output", "result.json"]); // 提供输出选项

    expect(mockSaveToJson).toHaveBeenCalledWith("result.json", mockResult); // 确保保存函数被调用
  });
});

// describe("index.ts", () => {
//   beforeEach(() => {
//     vi.clearAllMocks(); // 清除所有 mocks，确保每个测试都是独立的
//   });

//   describe("analyze command", () => {
//     it("should analyze dependencies for the specified target file", async () => {
//       const mockTargetFile = "./src/enum/cacheEnum.ts";
//       const mockRootDir = "./src";
//       const mockResolvedTargetFile = "./src/enum/cacheEnum.ts";
//       const mockAliases = {}; // 模拟别名
//       const mockTree = {}; // 模拟构建引用树

//       // 设置 mock 返回值
//       (ensureTsExtension as vi.Mock).mockResolvedValue(mockResolvedTargetFile);
//       (resolveTsconfigAlias as vi.Mock).mockResolvedValue(mockAliases);
//       (buildImportTree as vi.Mock).mockResolvedValue(mockTree);

//       // 模拟 console.log
//       const consoleLogSpy = vi
//         .spyOn(console, "log")
//         .mockImplementation(() => {});

//       await runCLI(["analyze", mockTargetFile, "--root", mockRootDir]);

//       expect(ensureTsExtension).toHaveBeenCalledWith(mockTargetFile); // 检查文件后缀补全调用
//       expect(resolveTsconfigAlias).toHaveBeenCalledWith(mockRootDir); // 检查别名解析调用
//       expect(buildImportTree).toHaveBeenCalledWith(
//         mockRootDir,
//         mockResolvedTargetFile,
//         mockAliases
//       ); // 检查引用树构建调用
//       expect(printTree).toHaveBeenCalledWith(mockTree); // 检查打印树调用
//       expect(consoleLogSpy).toHaveBeenCalledWith(
//         `引用 ${mockResolvedTargetFile} 的文件结构:`
//       ); // 检查输出信息

//       consoleLogSpy.mockRestore(); // 恢复 console.log 的默认实现
//     });

//     it("should print a message when no tree is found", async () => {
//       const mockTargetFile = "src/enum/cacheEnum.ts";
//       const mockRootDir = "src";

//       (ensureTsExtension as vi.Mock).mockResolvedValue(mockTargetFile);
//       (buildImportTree as vi.Mock).mockResolvedValue(null); // 模拟未找到引用树

//       const consoleLogSpy = vi
//         .spyOn(console, "log")
//         .mockImplementation(() => {});

//       await runCLI(["analyze", mockTargetFile, "--root", mockRootDir]);

//       expect(consoleLogSpy).toHaveBeenCalledWith(
//         `未找到引用 ${mockTargetFile} 的文件`
//       ); // 检查输出信息

//       consoleLogSpy.mockRestore(); // 恢复 console.log 的默认实现
//     });
//   });
// });
