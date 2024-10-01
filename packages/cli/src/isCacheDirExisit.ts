import { existsSync, mkdirSync } from "fs";
import { join } from "path";

// 确保 .cache 目录存在
export const ensureCacheDirectoryExists = () => {
  const cacheDir = join(process.cwd(), ".cache");
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir);
    console.log("缓存目录已创建: .cache");
  }
};
