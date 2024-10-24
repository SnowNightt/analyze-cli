import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__test__/**/*.test.ts"], // 测试文件
    globals: true,
    environment: "node", // 使用 Node.js 环境
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage", // 覆盖率报告的输出目录
    },
    // 跳过文件夹
    exclude: ["node_modules", "dist", ".git"],
    // 测试报告器
    reporters: ["default"],
  },
});
