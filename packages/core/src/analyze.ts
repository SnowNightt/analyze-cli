import { getLockfileInfo } from "./lockfileParser";
import { createCacheManager } from "./cache";
import { logger } from "@analyze-cli/shared";

export const analyzeDependencies = async (dir: string, depth: number = 1) => {
  const cacheManager = await createCacheManager();

  if (await cacheManager.isUpToDate(dir, depth)) {
    logger.info("从缓存中加载依赖数据...\n");
    return await cacheManager.getDependencies(dir);
  }

  const lockfileData = await getLockfileInfo(dir);

  const dependencyCache = new Map<string, any>();

  logger.define("依赖分析中...\n", "magenta");

  // 提取 packages 中的依赖项
  const packages = await getDependencyTree(
    lockfileData.packages, // 直接传递 lockfileData.packages
    depth,
    dependencyCache
  );

  const result = { name: "项目依赖", packages };

  await cacheManager.updateCache(dir, result, depth);

  return result;
};
// 没用promise.all
// const getDependencyTree = async (
//   packages: Record<string, any>, // 直接接收 packages 对象
//   depth: number,
//   dependencyCache: Map<string, any>,
//   currentDepth: number = 1
// ): Promise<any> => {
//   if (currentDepth > depth) return {};

//   const subPackages: Record<string, any> = {};

//   // 遍历所有包
//   for (const [packageName, packageInfo] of Object.entries(packages)) {
//     if (!packageInfo.dependencies) continue; // 如果没有依赖，跳过

//     subPackages[packageName] = {
//       version: packageInfo.version,
//       packages: await getDependencyTree(
//         packages,
//         depth,
//         dependencyCache,
//         currentDepth + 1
//       ),
//     };
//   }

//   return subPackages;
// };
const getDependencyTree = async (
  packages: Record<string, any>,
  depth: number,
  dependencyCache: Map<string, any>,
  currentDepth: number = 1
): Promise<any> => {
  if (currentDepth > depth) return {};

  const subPackages: Record<string, any> = {};

  // 获取所有需要处理的包名
  const packageNames = Object.keys(packages);

  // 并行处理每个包
  await Promise.all(
    packageNames.map(async (packageName) => {
      const packageInfo = packages[packageName];
      if (!packageInfo.dependencies) return; // 如果没有依赖，跳过

      subPackages[packageName] = {
        version: packageInfo.version,
        packages: await getDependencyTree(
          packages,
          depth,
          dependencyCache,
          currentDepth + 1
        ),
      };
    })
  );

  return subPackages;
};
