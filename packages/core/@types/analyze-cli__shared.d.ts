declare module "@analyze-cli/shared" {
  export const logger: {
    info: (message: string) => void;
    define: (message: string, color?: string) => void;
    // 在这里添加其他导出的成员
  };
}
