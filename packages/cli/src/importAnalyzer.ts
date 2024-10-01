import fs from "node:fs";
import path from "node:path";
import { getTsPaths, resolveAlias } from "./aliasResolver.ts";
import chalk from "chalk";

export async function analyzeImports(file: string) {
  const currentDir = process.cwd();
  if (file.endsWith(".js")) {
    console.log(chalk.red("该工具仅支持.ts结尾的文件"));
    return;
  }
  const ext = file.endsWith(".ts") ? "" : ".ts";
  const targetFile = path.resolve(currentDir, file + ext);
  const references: string[] = [];
  // 获取当前目录下所有.ts文件路径
  const allFiles = scanDirectory(currentDir);
  // 获取当前目录下的tsconfig.json文件compilerOptions配置项的paths属性（获取路径别名），如果没有，返回空对象
  const tsPaths = getTsPaths(currentDir);
  // console.log(allFiles);

  for (const filePath of allFiles) {
    if (filePath.endsWith(".ts")) {
      const content = fs.readFileSync(filePath, "utf-8");

      const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content))) {
        const importPath = match[1];
        // ./aliasResolver
        let resolvedPath = importPath;

        if (Object.keys(tsPaths).length > 0) {
          resolvedPath = resolveAlias(importPath, tsPaths) || importPath;
        }
        // 找到当前遍历的文件中所引用的目标文件的路径
        const absoluteImportPath = path.resolve(
          path.dirname(filePath),
          resolvedPath
        );
        // console.log("resolvePath", resolvedPath);
        // console.log("absoluteImportPath", absoluteImportPath);
        // console.log("targetFile", targetFile);

        if (absoluteImportPath === targetFile) {
          references.push(filePath);
        }
      }
    }
  }

  if (references.length > 0) {
    console.log(`The following files reference ${file}:`);
    references.forEach((ref) => console.log(ref));
  } else {
    console.log(`No files reference ${file}.`);
  }
}

function scanDirectory(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectory(filePath));
    } else if (filePath.endsWith(".ts")) {
      results.push(filePath);
    }
  });

  return results;
}
