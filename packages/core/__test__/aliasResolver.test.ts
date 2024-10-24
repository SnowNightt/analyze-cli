// tests/utils.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from "vitest";
import fs from "fs/promises";
import path from "path";
import { resolveTsconfigAlias } from "../src/aliasResolver"; // 根据实际路径调整
import { logger } from "@analyze-cli/shared";

// Mock fs/promises
vi.mock("fs/promises");
vi.mock("@analyze-cli/shared", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("resolveTsconfigAlias", () => {
  afterEach(() => {
    vi.restoreAllMocks(); // 清理每个测试后的 mocks
  });

  it("should log error if tsconfig.json is malformed", async () => {
    (fs.access as unknown as vi.Mock).mockResolvedValueOnce(undefined);
    (fs.readFile as unknown as vi.Mock).mockResolvedValueOnce(
      "{ invalid json }"
    );

    const aliases = await resolveTsconfigAlias("mockDir");
    expect(aliases).toBeNull();
  });

  it("should log info if tsconfig.json does not exist", async () => {
    (fs.access as unknown as vi.Mock).mockRejectedValueOnce(
      new Error("File not found")
    );

    const aliases = await resolveTsconfigAlias("mockDir");
    expect(aliases).toBeNull();
    expect(logger.info).toHaveBeenCalledWith(
      "未找到 tsconfig.json，将跳过路径别名解析。"
    );
  });
});
