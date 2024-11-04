import { getProjectInfo, getDependencyTree } from "./utils.ts";
import { createCacheManager } from "./cache.ts";
import { logger } from "@analyze-cli/shared";

export const analyzeDependencies = async (dir: string, depth: number = 1) => {
  // 初始化缓存管理器
  const cacheManager = await createCacheManager();
  // 首先检查缓存是否可用
  if (await cacheManager.isUpToDate(dir, depth)) {
    // console.log(chalk.yellow("从缓存中加载依赖数据...\n"));
    logger.info('从缓存中加载依赖数据...\n')
    return await cacheManager.getDependencies(dir); // 直接返回缓存数据
  }

  const { name, version, dependencies, devDependencies } = await getProjectInfo(
    dir
  );
  const packages: Record<string, any> = {};

  // console.log(chalk.blue("依赖分析中...\n"));
  logger.define('依赖分析中...\n',"magenta")

  // 缓存依赖树,解决循环依赖的问题,同一个依赖被多个包引用提升性能
  const dependencyCache = new Map<string, any>();

  // 并行处理
  const processDependencies = async (
    deps: Record<string, string>,
    type: string
  ) => {
    return Promise.all(
      Object.keys(deps).map(async (dep) => {
        const depVersion = deps[dep];
        let result = dependencyCache.get(dep);
        // 检查缓存
        if (!result) {
          result = { version: depVersion, type };

          // 如果深度大于1，递归获取子依赖
          if (depth > 1) {
            result.packages = await getDependencyTree(dep, 1, depth, dependencyCache);
          }
          dependencyCache.set(dep, result); // 缓存依赖树
        }
        return { [dep]: result };
      })
    );
  };

  // 使用 Promise.all() 并行处理 dependencies 和 devDependencies
  const [prodDeps, devDeps] = await Promise.all([
    processDependencies(dependencies, "dependency"), // 生产依赖
    processDependencies(devDependencies, "devDependency"), // 开发依赖
  ]);

  // 将所有解析结果合并到 packages 对象中
  prodDeps.forEach((dep) => Object.assign(packages, dep));
  devDeps.forEach((dep) => Object.assign(packages, dep));

  // console.log(chalk.green("项目依赖分析完成!\n"));

  const result = {
    name: name || "__root__",
    version: version || "0.0.0",
    packages,
  };

  // 更新缓存
  await cacheManager.updateCache(dir, result, depth);

  return result;
};
