import { cac } from "cac";
import { analyzeDependencies } from "@analyze-cli/core";
import { saveToJson } from "./output.ts";
import { ensureCacheDirectoryExists } from "./isCacheDirExisit.ts";
// import { ensureTsExtension } from "./utils.ts";
import { ensureTsExtension } from "@analyze-cli/core";
import {resolveTsconfigAlias} from '@analyze-cli/core'
import { scanProjectFiles } from "@analyze-cli/core";
const cli = cac("analyze-cli");
// 分析项目依赖
cli
  .command("[dir]", "Analyze the dependencies of a project")
  .option("-o,--output <output>", "Specify the output file")
  .option("--dep, -d <depth>", "Specify the dependency depth", { default: 1 })
  .action(async (dir = process.cwd(), options) => {
    try {
      // 在工具运行时检查缓存目录
      ensureCacheDirectoryExists();
      const depth = parseInt(options.dep, 10) || 1; // 处理深度参数，默认1
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

// 分析文件引用
// cli
//   .command("analyze <file>", "Analyze file imports")
//   .action(async (file: string) => {
//     await analyzeImports(file);
//   });

cli
  .command("analyze <targetFile>", "分析项目中哪些文件导入了指定的 .ts 文件")
  .option("-r,--root <root>", "要扫描的项目根目录", { default: "." })
  .action(async (targetFile: string, options: { root: string }) => {
    // 补全 .ts 后缀
    const resolvedTargetFile = await ensureTsExtension(targetFile);
    const aliases = await resolveTsconfigAlias(options.root);
    await scanProjectFiles(options.root, resolvedTargetFile, aliases);
  });

cli.help();
cli.version("0.0.0");
cli.parse();
