// tests/index.test.ts
import { resolve } from "../src/index"; // 根据实际路径调整
import { describe, it, expect } from "vitest"; // 引入 vitest API
import * as aliasResolver from "../src/aliasResolver"; // 引入具体模块
import * as analyze from "../src/analyze"; // 引入具体模块
import * as utils from "../src/utils"; // 引入具体模块
import * as treeBuilder from "../src/treeBuilder"; // 引入具体模块

describe("index module", () => {
  it("should export resolve function from aliasResolver", () => {
    expect(typeof resolve).toBe("function"); // 检查 resolve 是否是一个函数
  });

  it("should export all functions from aliasResolver", () => {
    expect(aliasResolver).toHaveProperty("resolveTsconfigAlias"); // 确保 resolveTsconfigAlias 中的函数被正确导出
  });

  it("should export all functions from analyze", () => {
    expect(analyze).toHaveProperty("analyzeDependencies"); // 假设 analyze.ts 有个名为 analyzeDependencies 的函数
  });

  it("should export all functions from utils", () => {
    expect(utils).toHaveProperty("resolveFilePath"); // 假设 utils.ts 有个名为 resolveFilePath 的函数
  });

  it("should export all functions from treeBuilder", () => {
    expect(treeBuilder).toHaveProperty("buildImportTree"); // 假设 treeBuilder.ts 有个名为 buildImportTree 的函数
  });
});
