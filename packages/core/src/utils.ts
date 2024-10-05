import fs from "fs/promises";
import {existsSync} from "fs";
import path from "path";
import { access } from "fs/promises";
// 查找并解析 package.json 文件
export const findPackageJson = async (dir: string): Promise<string | null> => {
  const packageJsonPath = path.join(dir, "package.json");
  try {
    await fs.access(packageJsonPath); // 检查文件是否存在
    return packageJsonPath;
  } catch {
    const parentDir = path.dirname(dir);
    if (parentDir === dir) {
      return null; // 达到根目录时返回 null
    }
    return findPackageJson(parentDir); // 递归查找父目录
  }
};

// 获取项目的基本信息和依赖
export const getProjectInfo = async (dir: string) => {
  const packageJsonPath = await findPackageJson(dir);
  if (!packageJsonPath) {
    throw new Error("Could not find package.json");
  }

  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
  const name = packageJson.name || "__root__";
  const version = packageJson.version || "0.0.0";
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  return { name, version, dependencies, devDependencies };
};

// 获取子依赖信息
export const getDependencyTree = async (
  pkg: string,
  currentDepth: number,
  maxDepth: number
) => {
  if (currentDepth >= maxDepth) return {};

  try {
    const pkgPath = require.resolve(path.join(pkg, "package.json"));
    const pkgJson = JSON.parse(await fs.readFile(pkgPath, "utf-8"));

    const dependencies = pkgJson.dependencies || {};
    const devDependencies = pkgJson.devDependencies || {};
    const subPackages: Record<string, any> = {};

    // 遍历子依赖，递归获取更深层次的依赖
    await Promise.all(
      Object.keys(dependencies).map(async (dep) => {
        subPackages[dep] = {
          version: dependencies[dep],
          type: "dependency",
          packages: await getDependencyTree(dep, currentDepth + 1, maxDepth),
        };
      })
    );

    await Promise.all(
      Object.keys(devDependencies).map(async (devDep) => {
        subPackages[devDep] = {
          version: devDependencies[devDep],
          type: "devDependency",
          packages: await getDependencyTree(devDep, currentDepth + 1, maxDepth),
        };
      })
    );

    return subPackages;
  } catch (error: any) {
    console.error(`Failed to load package ${pkg}:`, error.message);
    return {};
  }
};


// 分析文件引用

// 解析文件内容中的 import 路径
export function parseImportPaths(content: string): string[] {
  const regex = /import\s+[^'"]*['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

// 根据 import 路径、别名和后缀补全解析真实路径
export function resolveFilePath(
  importPath: string,
  file: string,
  rootDir: string,
  aliases: Record<string, string> | null
): string {
  let resolvedImportPath = importPath;

  // 处理路径别名
  if (aliases) {
    for (const alias in aliases) {
      if (importPath.startsWith(alias)) {
        resolvedImportPath = path.join(
          aliases[alias],
          importPath.slice(alias.length)
        );
        break;
      }
    }
  }

  // 如果 importPath 不是绝对路径，则相对于当前文件解析
  if (!path.isAbsolute(resolvedImportPath)) {
    resolvedImportPath = path.resolve(path.dirname(file), resolvedImportPath);
  }

  // 自动补全 .ts 后缀
  if (!path.extname(resolvedImportPath)) {
    const tsPath = resolvedImportPath + ".ts";
    if (existsSync(tsPath)) {
      return path.normalize(tsPath);
    }
  } else if (path.extname(resolvedImportPath) === ".ts") {
    return path.normalize(resolvedImportPath);
  }

  return path.normalize(resolvedImportPath);
}

// 自动补全后缀的函数
export async function ensureTsExtension(filePath: string): Promise<string> {
  if (!filePath.endsWith(".ts")) {
    const tsFilePath = `${filePath}.ts`;
    try {
      // 确认文件存在
      await access(tsFilePath);
      return tsFilePath;
    } catch (error) {
      console.error(`文件 ${tsFilePath} 不存在`);
      process.exit(1);
    }
  }
  return filePath;
}