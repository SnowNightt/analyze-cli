import fs from 'node:fs';
import path from 'node:path';

export function getTsPaths(baseDir: string): Record<string, string[]> {
  const tsconfigPath = path.join(baseDir, 'tsconfig.json');
  // 没tsconfig.json
  if (!fs.existsSync(tsconfigPath)) return {};

  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    return tsconfig.compilerOptions?.paths || {};
  } catch (error) {
    console.error('Error parsing tsconfig.json:', error);
    return {};
  }
}

export function resolveAlias(importPath: string, tsPaths: Record<string, string[]>): string | null {
  for (const [alias, paths] of Object.entries(tsPaths)) {
    const regex = new RegExp(`^${alias.replace('/*', '(/.*)?')}`);
    if (regex.test(importPath)) {
      const relativePath = importPath.replace(regex, paths[0].replace('/*', ''));
      return relativePath;
    }
  }
  return null;
}
