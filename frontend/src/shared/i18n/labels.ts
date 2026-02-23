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
  MISSING_IMAGE: "缺少图片文件",
  INVALID_FILE_TYPE: "图片格式不支持",
  FILE_TOO_LARGE: "图片体积超限",
  INVALID_MULTIPART: "请求格式错误",
  MISSING_DIRECTION: "缺少改款方向",
  INVALID_DIRECTION_PRESET: "预设方向无效",
  VALIDATION_ERROR: "请求参数校验失败",
  ANALYSIS_REQUEST_NOT_FOUND: "图像分析请求不存在",
  ANALYSIS_NOT_READY: "分析结果暂不可用",
  NOT_FOUND: "资源不存在",
  CROSS_CULTURAL_NOT_FOUND: "跨文化分析不存在",
  CROSS_CULTURAL_MISMATCH: "分析记录与请求不匹配",
  REDESIGN_NOT_FOUND: "改款建议不存在",
  DB_ERROR: "数据写入失败",
  PROVIDER_ERROR: "模型服务异常",
  PROVIDER_TIMEOUT: "模型服务超时",
  MODEL_OUTPUT_INVALID: "模型返回内容异常",
  FALLBACK_EXTRACTION_FAILED: "本地兜底提取失败",
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
