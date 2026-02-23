import type { ImageAssetResult } from "../types/api";

type Level = "HIGH" | "MEDIUM" | "LOW";
type ShowcaseVideoStatus = "SCRIPT_ONLY" | "SKIPPED";

const levelLabels: Record<Level, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

const imageAssetStatusLabels: Record<ImageAssetResult["status"], string> = {
  READY: "已生成",
  SKIPPED: "已跳过",
  FAILED: "生成失败",
};

const showcaseVideoStatusLabels: Record<ShowcaseVideoStatus, string> = {
  SCRIPT_ONLY: "仅脚本",
  SKIPPED: "已跳过",
};

const errorCodeLabels: Record<string, string> = {
  REQUEST_TIMEOUT: "请求超时",
  HTTP_ERROR: "网络请求异常",
  INTERNAL_ERROR: "系统内部异常",
  UNKNOWN_ERROR: "未知异常",
  MISSING_REQUEST_ID: "缺少请求编号",
  MISSING_DEPENDENCY_ID: "缺少依赖编号",
};

export function toLevelLabel(level: Level): string {
  return levelLabels[level];
}

export function toImageAssetStatusLabel(status: ImageAssetResult["status"]): string {
  return imageAssetStatusLabels[status];
}

export function toShowcaseVideoStatusLabel(status: ShowcaseVideoStatus): string {
  return showcaseVideoStatusLabels[status];
}

export function toErrorCodeLabel(code: string): string {
  return errorCodeLabels[code] ?? "未分类异常";
}
