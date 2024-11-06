import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

interface LockfileData {
  name: string;
  packages: Record<
    string,
    { version: string; dependencies: Record<string, string> }
  >;
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
      if (lockfilePath.endsWith("package-lock.json")) {
        return JSON.parse(lockfile);
      } else if (lockfilePath.endsWith("pnpm-lock.yaml")) {
        return parsePnpmLock(lockfile);
      } else if (lockfilePath.endsWith("yarn.lock")) {
        return parseYarnLock(lockfile);
      }
    }
  }

  throw new Error("No supported lockfile found.");
};

const fileExists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const parsePnpmLock = (content: string): LockfileData => {
  const lockfile = yaml.load(content) as Record<string, any>;

  const lockfileData: LockfileData = {
    name: lockfile.name || "__root__",
    packages: {},
  };

  // packages 字段应该在 lockfile 的顶层
  const packages = lockfile.packages || {};

  // 遍历所有包
  for (const [key, value] of Object.entries(packages)) {
    // 检查 key 是否以 "/" 开头
    if (key.startsWith("/")) {
      const packageName = key.replace("/", ""); // 获取包名
      const arr = packageName.split("@");
      const name = arr.slice(0, -1).join(''); // 去除末尾版本号
      lockfileData.packages[name] = {
        version: arr.at(-1) || "",
        dependencies: (value as any).dependencies || {},
      };
    }
    if (key.startsWith("/node_modules")) {
      const packageName = key.replace("/node_modules", ""); // 获取包名
      const arr = packageName.split("@");
      const name = arr.slice(0, -1).join(''); // 去除末尾版本号
      lockfileData.packages[name] = {
        version: arr.at(-1) || "",
        dependencies: (value as any).dependencies || {},
      };
    }
    
  }
  return lockfileData;
};

// Yarn.lock的解析可以通过正则表达式或现有的解析库来实现
const parseYarnLock = (content: string): LockfileData => {
  const lines = content.split("\n");
  const lockfileData: any = {};
  let currentPackage: string | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 识别包的开始
    if (trimmedLine.endsWith(":")) {
      currentPackage = trimmedLine.slice(0, -1).trim();
      lockfileData[currentPackage] = {
        version: "",
        dependencies: {},
      };
    } else if (currentPackage) {
      // 提取版本信息
      const versionMatch = trimmedLine.match(/"([^"]+)"/);
      if (versionMatch) {
        lockfileData[currentPackage].version = versionMatch[1];
      }

      // 提取依赖项
      const depMatch = trimmedLine.match(/dependencies?: (\{[^}]+\})/);
      if (depMatch) {
        const dependencies = JSON.parse(depMatch[1]);
        for (const [depName, depVersion] of Object.entries(dependencies)) {
          lockfileData[currentPackage].dependencies[depName] = {
            version: depVersion,
          };
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
