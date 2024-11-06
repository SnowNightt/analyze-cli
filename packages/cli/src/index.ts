import { cac } from "cac";
import { analyzeDependencies } from "@analyze-cli/core";
import { saveToJson } from "./output.ts";
import { ensureCacheDirectoryExists } from "./isCacheDirExisit.ts";
// import { ensureTsExtension } from "./utils.ts";
import { ensureTsExtension } from "@analyze-cli/core";
import { resolveTsconfigAlias } from "@analyze-cli/core";
// import { scanProjectFiles } from "@analyze-cli/core";
import { buildImportTree, printTree } from "@analyze-cli/core";
import { logger } from "@analyze-cli/shared";
const cli = cac("analyze-cli");
// 分析项目依赖
cli
  .command("[dir]", "Analyze the dependencies of a project")
  .option("-o, --output <output>", "Specify the output file")
  .option("--dep, -d <depth>", "Specify the dependency depth", { default: 1 })
  .action(async (dir = process.cwd(), options) => {
    try {
      ensureCacheDirectoryExists();
      const depth = parseInt(options.dep, 10) || 1;
      const result = await analyzeDependencies(dir, depth);
      if (options.output) {
        saveToJson(options.output, result);
      } else {
        console.log(result);
      }
    } catch (error: any) {
      console.error("Error analyzing dependencies:", error);
    }
  });

cli
  .command("analyze <targetFile>", "分析项目中哪些文件导入了指定的 .ts 文件")
  .option("-r,--root <root>", "要扫描的项目根目录", { default: "." })
  .action(async (targetFile: string, options: { root: string }) => {
    logger.define("开始分析文件引用...", "bgBlue");
    const rootDir = options.root || process.cwd();
    // 补全 .ts 后缀
    const resolvedTargetFile = await ensureTsExtension(targetFile);
    const aliases = await resolveTsconfigAlias(rootDir);
    // await scanProjectFiles(options.root, resolvedTargetFile, aliases);
    // 构建引用树
    const tree = await buildImportTree(rootDir, resolvedTargetFile, aliases);
    if (tree) {
      // logger.define('='.repeat(80),'green')
      logger.success(`引用 ${resolvedTargetFile} 的文件分析成功！~`);
      logger.define("被一下文件所引用：", "magenta");
      // logger.define(`引用 ${resolvedTargetFile} 的文件结构:`, "bgGreen", true);
      // console.log(`引用 ${resolvedTargetFile} 的文件结构:`);
      printTree(tree);
    } else {
      console.log(`未找到引用 ${resolvedTargetFile} 的文件`);
    }
  });

cli.help();
cli.version("0.0.0");
cli.parse();
// 导出 CLI 以便在测试中调用
export const runCLI = async (args: string[]) => {
  cli.parse(args);
};
