import fs from "fs/promises";
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
  // 限制最大递归深度
  if (currentDepth >= maxDepth || currentDepth >= 3) return {};

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

// 解析文件内容中的 import 路径
export function parseImportPaths(fileContent: string): string[] {
  const importRegex = /import\s.*?['"](.*?)['"]/g;
  const importPaths: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(fileContent)) !== null) {
    importPaths.push(match[1]);
  }

  return importPaths;
}

// 根据 import 路径、别名和后缀补全解析真实路径
export async function resolveFilePath(
  importPath: string,
  currentFile: string,
  rootDir: string,
  aliases: Record<string, string> | null
): Promise<string | null> {
  // 处理路径别名

  if (aliases) {
    // {'@': 'D:\\Desktop\\项目\\YBPX-Manage\\src\\src'}
    // @/enum/cacheEnum
    for (const alias in aliases) {
      if (importPath.startsWith(alias)) {
        const aliasPath = path.join(
          aliases[alias],
          importPath.slice(alias.length)
        );
        return await resolveWithTsExtension(aliasPath, rootDir);
      }
    }
  }

  // 处理相对路径或绝对路径
  const resolvedPath = path.resolve(path.dirname(currentFile), importPath);

  return await resolveWithTsExtension(resolvedPath, rootDir);
}

// 补全 .ts 后缀并检查文件存在
async function resolveWithTsExtension(
  resolvedPath: string,
  rootDir: string
): Promise<string | null> {
  const tsFilePath = resolvedPath.endsWith(".ts")
    ? resolvedPath
    : `${resolvedPath}.ts`;

  try {
    const stats = await fs.stat(tsFilePath);
    if (stats.isFile()) {
      return path.normalize(tsFilePath); // 使用 path.normalize 规范化路径
    }
  } catch (error) {
    return null;
  }

  return null;
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

// 比较路径，确保文件路径一致
export function comparePaths(path1: string, path2: string): boolean {
  return path.normalize(path1) === path.normalize(path2);
}
