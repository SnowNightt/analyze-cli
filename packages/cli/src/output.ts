import fs from "fs";
// import chalk from "chalk";
import { logger } from "@analyze-cli/shared";

// 将分析结果保存到 JSON 文件
export const saveToJson = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    logger.success(`依赖分析成功~ 依赖文件保存在${filePath}`)
    // console.log(chalk.green(`Analysis result saved to ${filePath}`));
  } catch (error: any) {
    logger.error(`写入json文件失败！${error.message}`);
    // console.error(chalk.red(`Failed to write JSON file: ${error.message}`));
  }
};
