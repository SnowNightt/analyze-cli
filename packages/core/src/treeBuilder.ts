import * as path from "path";
import fs from "fs/promises";
import { parseImportPaths, resolveFilePath, comparePaths } from "./utils";

// 定义树节点类型
export interface TreeNode {
  [filePath: string]: TreeNode;
}

// 构建引用树
export async function buildImportTree(
  rootDir: string,
  targetFile: string,
  aliases: Record<string, string> | null
): Promise<TreeNode | null> {
  //   const normalizedTargetFile = path.normalize(targetFile);
  // 规范化目标文件路径
  const normalizedTargetFile = path.resolve(
    process.cwd(),
    path.normalize(targetFile)
  );

  const files = await getFilesRecursively(rootDir);
  const tree: TreeNode = {};
  // 遍历所有.ts文件
  for (const file of files) {
    if (file.endsWith(".ts")) {
      const fileContent = await fs.readFile(file, "utf-8");
      const importPaths = parseImportPaths(fileContent);
      // 遍历文件中的import语句
      for (const importPath of importPaths) {
        const resolvedPath = await resolveFilePath(
          importPath, // '@/enum/cacheEnum'
          file, // D:\Desktop\项目\YBPX-Manage\src\router\guard.ts
          rootDir, // ./src
          aliases // {'@': 'D:\\Desktop\\项目\\YBPX-Manage\\src\\src'}
        );

        if (resolvedPath && comparePaths(resolvedPath, normalizedTargetFile)) {
          addToTree(tree, file, normalizedTargetFile); // 构建树结构
        }
      }
    }
  }

  return Object.keys(tree).length ? tree : null;
}

// 将文件添加到树中
function addToTree(tree: TreeNode, file: string, targetFile: string) {
  const normalizedFile = path.normalize(file);
  if (!tree[normalizedFile]) {
    tree[normalizedFile] = {}; // 初始化节点
  }
  tree[normalizedFile][targetFile] = {}; // 引用目标文件
}

// 递归输出树结构
export function printTree(tree: TreeNode, depth: number = 0) {
  const indent = " ".repeat(depth * 2); // 缩进格式
  for (const file in tree) {
    console.log(`${indent}- ${file}`);
    printTree(tree[file], depth + 1); // 递归输出子树
  }
}

// 递归获取项目目录下所有文件
async function getFilesRecursively(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFilesRecursively(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}
