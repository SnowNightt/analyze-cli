import { getLockfileInfo } from "./lockfileParser";
import { createCacheManager } from "./cache";
import { logger } from "@analyze-cli/shared";
export const analyzeDependencies = async (dir: string, depth: number = 1) => {
  const cacheManager = await createCacheManager();
  const lockfileData = await getLockfileInfo(dir);

  // 从锁文件中获取哈希值
  const lockfileHash = lockfileData.hash;

  // 检查缓存是否过期，增加对哈希值的检查
  if (await cacheManager.isUpToDate(dir, depth, lockfileHash)) {
    logger.info("从缓存中加载依赖数据...\n");
    return await cacheManager.getDependencies(dir);
  }

  const dependencyCache = new Map<string, any>();

  logger.define("依赖分析中...\n", "magenta");

  // 提取 packages 中的依赖项
  const packages = await getDependencyTree(
    lockfileData.packages, // 直接传递 lockfileData.packages
    depth,
    dependencyCache
  );

  const result = { name: "项目依赖", packages };

  // 更新缓存，并传入哈希值
  await cacheManager.updateCache(dir, result, depth, lockfileHash);

  return result;
};
// export const analyzeDependencies = async (dir: string, depth: number = 1) => {
//   const cacheManager = await createCacheManager();

//   if (await cacheManager.isUpToDate(dir, depth)) {
//     logger.info("从缓存中加载依赖数据...\n");
//     return await cacheManager.getDependencies(dir);
//   }

//   const lockfileData = await getLockfileInfo(dir);

//   const dependencyCache = new Map<string, any>();

//   logger.define("依赖分析中...\n", "magenta");

//   // 提取 packages 中的依赖项
//   const packages = await getDependencyTree(
//     lockfileData.packages, // 直接传递 lockfileData.packages
//     depth,
//     dependencyCache
//   );

//   const result = { name: "项目依赖", packages };

//   await cacheManager.updateCache(dir, result, depth);

//   return result;
// };
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
      // 如果这个包已经处理过，直接从缓存中获取
      if (dependencyCache.has(packageName)) {
        subPackages[packageName] = dependencyCache.get(packageName);
        return; // 跳过后续处理
      }
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
      // 将当前包的依赖树缓存起来，避免重复处理
      dependencyCache.set(packageName, subPackages[packageName]);
    })
  );

  return subPackages;
};
