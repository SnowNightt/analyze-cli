// import fs from "fs/promises";
// import path from "path";
// import yaml from "js-yaml";

// interface LockfileData {
//   name: string;
//   packages: Record<
//     string,
//     { version: string; dependencies: Record<string, string> }
//   >;
// }
// export const getLockfileInfo = async (dir: string): Promise<LockfileData> => {
//   const lockfilePaths = [
//     path.join(dir, "package-lock.json"),
//     path.join(dir, "pnpm-lock.yaml"),
//     path.join(dir, "yarn.lock"),
//   ];

//   for (const lockfilePath of lockfilePaths) {
//     if (await fileExists(lockfilePath)) {
//       const lockfile = await fs.readFile(lockfilePath, "utf-8");
//       if (lockfilePath.endsWith("package-lock.json")) {
//         return JSON.parse(lockfile);
//       } else if (lockfilePath.endsWith("pnpm-lock.yaml")) {
//         return parsePnpmLock(lockfile);
//       } else if (lockfilePath.endsWith("yarn.lock")) {
//         return parseYarnLock(lockfile);
//       }
//     }
//   }

//   throw new Error("No supported lockfile found.");
// };

// const fileExists = async (path: string) => {
//   try {
//     await fs.access(path);
//     return true;
//   } catch {
//     return false;
//   }
// };

// const parsePnpmLock = (content: string): LockfileData => {
//   const lockfile = yaml.load(content) as Record<string, any>;

//   const lockfileData: LockfileData = {
//     name: lockfile.name || "__root__",
//     packages: {},
//   };

//   // packages 字段应该在 lockfile 的顶层
//   const packages = lockfile.packages || {};

//   // 遍历所有包
//   for (const [key, value] of Object.entries(packages)) {
//     // 检查 key 是否以 "/" 开头
//     if (key.startsWith("/")) {
//       const packageName = key.replace("/", ""); // 获取包名
//       const arr = packageName.split("@");
//       const name = arr.slice(0, -1).join(''); // 去除末尾版本号
//       lockfileData.packages[name] = {
//         version: arr.at(-1) || "",
//         dependencies: (value as any).dependencies || {},
//       };
//     }
//     if (key.startsWith("/node_modules")) {
//       const packageName = key.replace("/node_modules", ""); // 获取包名
//       const arr = packageName.split("@");
//       const name = arr.slice(0, -1).join(''); // 去除末尾版本号
//       lockfileData.packages[name] = {
//         version: arr.at(-1) || "",
//         dependencies: (value as any).dependencies || {},
//       };
//     }

//   }
//   return lockfileData;
// };

// // Yarn.lock的解析可以通过正则表达式或现有的解析库来实现
// const parseYarnLock = (content: string): LockfileData => {
//   const lines = content.split("\n");
//   const lockfileData: any = {};
//   let currentPackage: string | null = null;

//   for (const line of lines) {
//     const trimmedLine = line.trim();

//     // 识别包的开始
//     if (trimmedLine.endsWith(":")) {
//       currentPackage = trimmedLine.slice(0, -1).trim();
//       lockfileData[currentPackage] = {
//         version: "",
//         dependencies: {},
//       };
//     } else if (currentPackage) {
//       // 提取版本信息
//       const versionMatch = trimmedLine.match(/"([^"]+)"/);
//       if (versionMatch) {
//         lockfileData[currentPackage].version = versionMatch[1];
//       }

//       // 提取依赖项
//       const depMatch = trimmedLine.match(/dependencies?: (\{[^}]+\})/);
//       if (depMatch) {
//         const dependencies = JSON.parse(depMatch[1]);
//         for (const [depName, depVersion] of Object.entries(dependencies)) {
//           lockfileData[currentPackage].dependencies[depName] = {
//             version: depVersion,
//           };
//         }
//       }

//       // 重置当前包，防止重复处理
//       if (trimmedLine === "") {
//         currentPackage = null;
//       }
//     }
//   }

//   return lockfileData;
// };
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import crypto from "crypto";

interface LockfileData {
  name: string;
  packages: Record<
    string,
    { version: string; dependencies: Record<string, string> }
  >;
  hash: string; // 添加了 hash 字段，用于缓存检查
}

export const getLockfileInfo = async (dir: string): Promise<LockfileData> => {
  const lockfilePaths = [
    path.join(dir, "package-lock.json"),
    path.join(dir, "pnpm-lock.yaml"),
    path.join(dir, "yarn.lock"),
  ];

  for (const lockfilePath of lockfilePaths) {
    if (await fileExists(lockfilePath)) {
      const lockfile = await fs.readFile(lockfilePath, "utf-8");

      // 计算哈希值，用于检查锁文件内容是否变化
      const hash = crypto.createHash("sha256").update(lockfile).digest("hex");

      if (lockfilePath.endsWith("package-lock.json")) {
        const parsedData = JSON.parse(lockfile);
        return {
          name: parsedData.name || "__root__",
          packages: parseNpmLock(parsedData),
          hash,
        };
      } else if (lockfilePath.endsWith("pnpm-lock.yaml")) {
        const parsedData = parsePnpmLock(lockfile);
        return {
          ...parsedData,
          hash,
        };
      } else if (lockfilePath.endsWith("yarn.lock")) {
        const parsedData = parseYarnLock(lockfile);
        return {
          ...parsedData,
          hash,
        };
      }
    }
  }

  throw new Error("No supported lockfile found.");
};

// 辅助函数，检查文件是否存在
const fileExists = async (filePath: string) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// 解析 package-lock.json
const parseNpmLock = (data: any): Record<string, any> => {
  const packages: Record<string, any> = {};
  const dependencies = data.dependencies || {};

  // 递归解析依赖
  const parseDependencies = (deps: Record<string, any>) => {
    for (const [name, info] of Object.entries(deps)) {
      packages[name] = {
        version: info.version,
        dependencies: info.dependencies || {},
      };
      if (info.dependencies) {
        parseDependencies(info.dependencies);
      }
    }
  };

  parseDependencies(dependencies);
  return packages;
};

// 解析 pnpm-lock.yaml
const parsePnpmLock = (content: string): LockfileData => {
  const lockfile = yaml.load(content) as Record<string, any>;

  const lockfileData: LockfileData = {
    name: lockfile.name || "__root__",
    packages: {},
    hash: "",
  };

  // packages 字段应该在 lockfile 的顶层
  const packages = lockfile.packages || {};
  console.log(packages);
  
  // 遍历所有包
  for (const [key, value] of Object.entries(packages)) {
    // 检查 key 是否以 "/" 开头
    if (key.startsWith("/")) {
      const packageName = key.replace("/", ""); // 获取包名
      const arr = packageName.split("@");
      const name = arr.slice(0, -1).join(""); // 去除末尾版本号
      lockfileData.packages[name] = {
        version: arr.at(-1) || "",
        dependencies: (value as any).dependencies || {},
      };
    }
    if (key.startsWith("/node_modules")) {
      const packageName = key.replace("/node_modules", ""); // 获取包名
      const arr = packageName.split("@");
      const name = arr.slice(0, -1).join(""); // 去除末尾版本号
      lockfileData.packages[name] = {
        version: arr.at(-1) || "",
        dependencies: (value as any).dependencies || {},
      };
    }
  }

  return lockfileData;
};

// 解析 yarn.lock
const parseYarnLock = (content: string): LockfileData => {
  const lines = content.split("\n");
  const lockfileData: LockfileData = {
    name: "__root__",
    packages: {},
    hash: "",
  };
  let currentPackage: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 识别包的开始
    if (trimmedLine.endsWith(":")) {
      currentPackage = trimmedLine.slice(0, -1).trim();
      lockfileData.packages[currentPackage] = {
        version: "",
        dependencies: {},
      };
    } else if (currentPackage) {
      // 提取版本信息
      const versionMatch = trimmedLine.match(/"([^"]+)"/);
      if (versionMatch) {
        lockfileData.packages[currentPackage].version = versionMatch[1];
      }

      // 提取依赖项
      const depMatch = trimmedLine.match(/dependencies?: (\{[^}]+\})/);
      if (depMatch) {
        const dependencies = JSON.parse(depMatch[1]);
        for (const [depName, depVersion] of Object.entries(dependencies)) {
          lockfileData.packages[currentPackage].dependencies[depName] =
            depVersion as string;
        }
      }

      // 重置当前包，防止重复处理
      if (trimmedLine === "") {
        currentPackage = null;
      }
    }
  }

  return lockfileData;
};
