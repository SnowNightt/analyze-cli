import fs from 'fs';
import chalk from 'chalk';

// 将分析结果保存到 JSON 文件
export const saveToJson = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(chalk.green(`Analysis result saved to ${filePath}`));
  } catch (error:any) {
    console.error(chalk.red(`Failed to write JSON file: ${error.message}`));
  }
};
