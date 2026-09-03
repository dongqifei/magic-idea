import { CronExpressionParser } from "cron-parser";
export const cronParser = (cron: string, number: number = 3) => {
  const interval = CronExpressionParser.parse(cron, {
    currentDate: new Date().toISOString(), // 确保日期格式正确
    strict: false, // 兼容更多表达式格式
    tz: 'Asia/Shanghai', // 显式指定时区
  });

  const runs: string[] = interval.take(number).map((date) => {
    return date.toDate().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  });
  return runs;
};
