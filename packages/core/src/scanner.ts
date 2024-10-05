import { promises as fsPromises } from "fs";
import * as path from "path";
import { parseImportPaths, resolveFilePath } from "./utils";

export async function scanProjectFiles(
  rootDir: string,
  targetFile: string,
  aliases: Record<string, string> | null
) {
  const files = await getFilesRecursively(rootDir);
  for (const file of files) {
    if (file.endsWith(".ts")) {
      try {
        const fileContent = await fsPromises.readFile(file, "utf-8");
        const importPaths = parseImportPaths(fileContent);

        for (const importPath of importPaths) {
          const resolvedPath = resolveFilePath(
            importPath,
            file,
            rootDir,
            aliases
          );
          if (
            path.normalize(resolvedPath) ===
            path.normalize(path.resolve(rootDir, targetFile))
          ) {
            console.log(`${file} 导入了 ${targetFile}`);
          }
        }
      } catch (error) {
        console.warn(`无法读取文件 ${file}: ${error.message}`);
      }
    }
  }
}

// 递归获取项目目录下所有文件
async function getFilesRecursively(dir: string): Promise<string[]> {
  const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFilesRecursively(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}
