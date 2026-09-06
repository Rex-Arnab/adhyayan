import Link from "next/link";

import { Progress } from "@/components/ui/progress";
import { formatMinutes } from "@/lib/reading";

const SURFACE = ["bg-sky", "bg-tangerine", "bg-lilac", "bg-sky"] as const;

export type CourseCardData = {
  slug: string;
  title: string;
  summary: string;
  coverEmoji: string;
  level: string;
  tags: string[];
  estimatedMinutes: number;
  chapterCount: number;
  progressPct?: number | null;
};

export function CourseCard({
  course,
  index = 0,
}: {
  course: CourseCardData;
  index?: number;
}) {
  const enrolled = typeof course.progressPct === "number";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col rounded-3xl border bg-card p-6 transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
    >
      <div
        className={`flex size-14 items-center justify-center rounded-2xl text-2xl ${SURFACE[index % SURFACE.length]}`}
        aria-hidden
      >
        {course.coverEmoji}
      </div>

      <h3 className="mt-5 text-xl font-extrabold tracking-[-0.02em]">
        {course.title}
      </h3>
      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted-foreground">
        {course.summary}
      </p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {course.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>{course.chapterCount} chapters</span>
        <span aria-hidden>·</span>
        <span>{formatMinutes(course.estimatedMinutes)}</span>
        <span aria-hidden>·</span>
        <span className="capitalize">{course.level.toLowerCase()}</span>
      </div>

      {enrolled ? (
        <div className="mt-4">
          <Progress value={course.progressPct ?? 0} className="h-2" />
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            {course.progressPct}% complete
          </p>
        </div>
      ) : null}
    </Link>
  );
}
