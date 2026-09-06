"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CourseCard, type CourseCardData } from "@/components/course-card";
import { Input } from "@/components/ui/input";

export function CourseCatalog({ courses }: { courses: CourseCardData[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(
    () => [...new Set(courses.flatMap((c) => c.tags))].sort(),
    [courses],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesTag = !tag || c.tags.includes(tag);
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q));
      return matchesTag && matchesQuery;
    });
  }, [courses, query, tag]);

  return (
    <>
      <div className="mt-8 flex flex-col gap-4">
        <div className="relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses"
            aria-label="Search courses"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={tag === null} onClick={() => setTag(null)}>
            All
          </FilterChip>
          {tags.map((t) => (
            <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>
              {t}
            </FilterChip>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed p-12 text-center">
          <p className="text-lg font-semibold">No courses match that.</p>
          <p className="mt-2 text-muted-foreground">
            Try a different word, or clear the filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTag(null);
            }}
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-85"
          >
            Show all courses
          </button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((course, i) => (
            <CourseCard key={course.slug} course={course} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors duration-150 ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
