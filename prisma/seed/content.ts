import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { countWords, estimateMinutes } from "../../src/lib/reading";

export type ChapterSeed = {
  order: number;
  slug: string;
  title: string;
  contentMd: string;
  wordCount: number;
  estimatedMinutes: number;
};

const CONTENT_ROOT = join(process.cwd(), "prisma", "content");

/**
 * Reads `prisma/content/<dir>/NN-slug.md` into chapter records.
 *
 * The numeric filename prefix is the chapter order and the rest is the slug, so
 * reordering a course is a rename rather than a code change. The `#` heading is
 * the title — it is never duplicated in frontmatter, so the two cannot drift.
 */
export function loadChapters(dir: string): ChapterSeed[] {
  const files = readdirSync(join(CONTENT_ROOT, dir))
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No markdown chapters found in prisma/content/${dir}`);
  }

  return files.map((file) => {
    const match = /^(\d+)-(.+)\.md$/.exec(file);
    if (!match) {
      throw new Error(
        `Chapter filename must be NN-slug.md, got "${file}" in ${dir}`,
      );
    }
    const [, orderRaw, slug] = match;

    const contentMd = readFileSync(join(CONTENT_ROOT, dir, file), "utf8").trim();

    const heading = /^#\s+(.+)$/m.exec(contentMd);
    if (!heading || !contentMd.startsWith("# ")) {
      throw new Error(
        `${dir}/${file} must start with a single "# Title" heading`,
      );
    }

    const wordCount = countWords(contentMd);

    return {
      order: Number(orderRaw),
      slug,
      title: heading[1].trim(),
      contentMd,
      wordCount,
      estimatedMinutes: estimateMinutes(wordCount),
    };
  });
}
