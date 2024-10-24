import { saveToJson } from "../src/output";
import fs from "fs";
import { logger } from "@analyze-cli/shared";

vi.mock("fs");
vi.mock("@analyze-cli/shared", () => ({
  logger: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("saveToJson", () => {
  const filePath = "/mocked/dir/output.json";
  const data = { key: "value" };

  it("should write JSON data to the specified file", () => {
    saveToJson(filePath, data);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
    expect(logger.success).toHaveBeenCalledWith(
      `依赖分析成功~ 依赖文件保存在${filePath}`
    );
  });

  it("should log an error if writing fails", () => {
    (fs.writeFileSync as vi.Mock).mockImplementation(() => {
      throw new Error("Write error");
    });

    saveToJson(filePath, data);

    expect(logger.error).toHaveBeenCalledWith("写入json文件失败！Write error");
  });
});
