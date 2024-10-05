import * as path from "path";
import { promises as fsPromises } from "fs";
import { logger } from "@analyze-cli/shared";
export async function resolveTsconfigAlias(
  rootDir: string
): Promise<Record<string, string> | null> {
  const tsconfigPath = path.join(rootDir, "tsconfig.json");

  try {
    await fsPromises.access(tsconfigPath);
    const tsconfigContent = await fsPromises.readFile(tsconfigPath, "utf-8");
    const tsconfig = JSON.parse(tsconfigContent);

    if (tsconfig.compilerOptions?.paths) {
      const paths = tsconfig.compilerOptions.paths;
      const baseUrl = tsconfig.compilerOptions.baseUrl || ".";
      const aliases: Record<string, string> = {};

      for (const alias in paths) {
        // 处理像 "@components/*" 这样的别名
        const cleanAlias = alias.replace("/*", "");
        const targetPath = paths[alias][0].replace("/*", "");
        const resolvedPath = path.resolve(rootDir, baseUrl, targetPath);
        aliases[cleanAlias] = resolvedPath;
      }

      return aliases;
    } else {
      console.warn("tsconfig.json 中未配置路径别名，忽略路径别名解析。");
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      logger.info("未找到 tsconfig.json，将跳过路径别名解析。")
      // console.warn("未找到 tsconfig.json，将跳过路径别名解析。");
    } else {
      logger.error(`解析 tsconfig.json 时出错: ${error.message}`)
      // console.warn(`解析 tsconfig.json 时出错: ${error.message}`);
    }
  }

  return null;
}
