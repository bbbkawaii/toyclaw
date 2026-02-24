import type { MultipartFile } from "@fastify/multipart";
import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { AppError } from "../errors";

export interface StoredFileResult {
  absolutePath: string;
  relativePath: string;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export class LocalFileStorage {
  constructor(private readonly baseDir: string) {}

  async saveFile(filePart: MultipartFile): Promise<StoredFileResult> {
    const extension = EXT_BY_MIME[filePart.mimetype];
    if (!extension) {
      throw new AppError("Only jpg/png/webp images are accepted", "INVALID_FILE_TYPE", 415);
    }

    const date = new Date();
    const segments = [
      String(date.getUTCFullYear()),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0"),
    ];

    const filename = `${randomUUID()}${extension}`;
    const relativePath = join(...segments, filename);
    const absolutePath = join(this.baseDir, relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });

    try {
      await pipeline(filePart.file, createWriteStream(absolutePath));

      if (filePart.file.truncated) {
        await rm(absolutePath, { force: true }).catch(() => undefined);
        throw new AppError("Uploaded file exceeds size limit", "FILE_TOO_LARGE", 413);
      }

      return {
        absolutePath,
        relativePath: relativePath.replaceAll("\\", "/"),
      };
    } catch (error) {
      await rm(absolutePath, { force: true }).catch(() => undefined);

      if (filePart.file.truncated) {
        throw new AppError("Uploaded file exceeds size limit", "FILE_TOO_LARGE", 413);
      }

      throw error;
    }
  }
}
