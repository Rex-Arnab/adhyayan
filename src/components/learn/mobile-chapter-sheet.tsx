"use client";

import { PanelLeft } from "lucide-react";
import { useState } from "react";

import { ChapterNav } from "@/components/learn/chapter-nav";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { LearnChapter } from "@/lib/progress";

export function MobileChapterSheet(props: {
  courseSlug: string;
  courseTitle: string;
  chapters: LearnChapter[];
  currentChapterId: string;
  progressPct: number;
  completedCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold lg:hidden"
        aria-label="Open chapter list"
      >
        <PanelLeft className="size-4" aria-hidden />
        Chapters
      </SheetTrigger>

      <SheetContent side="left" className="w-[19rem] p-0">
        <SheetTitle className="sr-only">Chapters</SheetTitle>
        <SheetDescription className="sr-only">
          Jump to any chapter in {props.courseTitle}
        </SheetDescription>
        <ChapterNav {...props} inSheet onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
