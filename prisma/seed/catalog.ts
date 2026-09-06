/**
 * The catalogue definition. Chapter titles/slugs are derived from the markdown
 * filenames and their `#` heading, so this file only carries course-level facts.
 *
 * Tags overlap deliberately — `frontend` links JavaScript to CSS, `programming`
 * links JavaScript to Git, `backend`/`data` links SQL outward. Those overlaps are
 * the signal the content-based recommender learns from.
 */
export type CourseSeed = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverEmoji: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  tags: string[];
  /** Directory under prisma/content/ holding this course's chapters. */
  dir: string;
};

export const COURSES: CourseSeed[] = [
  {
    slug: "javascript-fundamentals",
    title: "JavaScript Fundamentals",
    summary:
      "Values, functions, arrays and closures — the language core, without the framework noise.",
    description: `Every framework you will ever use is built on the handful of ideas in this course.

We start with values and variables, work through types, control flow and functions, then finish with the two things that separate people who *use* JavaScript from people who *understand* it: array methods and closures.

There is no build tooling here and no framework. Everything runs in a browser console or Node. If you have copied JavaScript before without quite knowing why it worked, this is the course that fixes that.`,
    coverEmoji: "📜",
    level: "BEGINNER",
    tags: ["javascript", "programming", "frontend"],
    dir: "js-fundamentals",
  },
  {
    slug: "css-layout",
    title: "CSS Layout: Flexbox & Grid",
    summary:
      "Stop fighting your layouts. Learn the two systems that make CSS predictable.",
    description: `Most CSS frustration is layout frustration, and almost all of it comes from using the wrong system for the job.

This course builds the mental model first — the box model, normal flow, and the difference between a one-dimensional and a two-dimensional problem — then teaches Flexbox and Grid as the tools they actually are.

By the end you will know, on sight, whether a layout wants \`flex\` or \`grid\`, and you will be building responsive pages with far fewer media queries than you expect.`,
    coverEmoji: "🎨",
    level: "BEGINNER",
    tags: ["css", "frontend", "design"],
    dir: "css-layout",
  },
  {
    slug: "sql-for-beginners",
    title: "SQL for Beginners",
    summary:
      "Ask a database real questions — SELECT through JOINs, CTEs and indexes.",
    description: `SQL is the most durable skill in software. The syntax you learn here has barely changed in thirty years and works in Postgres, MySQL, SQLite and every warehouse you will meet.

We use one running example throughout — a small bookstore with authors, books and orders — so each chapter builds on a schema you already understand rather than a new toy example every time.

You will finish able to filter, group, join and optimise, and to read a slow query and have a real theory about why it is slow.`,
    coverEmoji: "🗄️",
    level: "BEGINNER",
    tags: ["sql", "data", "backend"],
    dir: "sql-for-beginners",
  },
  {
    slug: "git-github-basics",
    title: "Git & GitHub Basics",
    summary:
      "The three areas, what a commit really is, and how to work with other people.",
    description: `Git is not complicated, but it is badly explained. Most tutorials hand you a list of commands to memorise and never tell you what the commands are doing.

This course does the opposite. You will learn the three areas — working tree, staging area, repository — and what a commit and a branch actually are underneath. Once those click, the commands stop needing memorising.

The last chapters move to GitHub: remotes, pull requests, and how to give and receive a code review without friction.`,
    coverEmoji: "🌿",
    level: "BEGINNER",
    tags: ["git", "tools", "programming"],
    dir: "git-github-basics",
  },
  {
    slug: "python-basics",
    title: "Python for Beginners",
    summary:
      "From variables to files — the language core, with the traps that bite everyone.",
    description: `Python asks you to write down very little that is not the idea itself, which is why it is a good first language and a dangerous second one.

This course covers the core: values and types, strings, control flow, functions, lists and dicts, comprehensions, and the modules, files and exceptions that turn a script into a program.

Every chapter names the specific traps — mutable default arguments, \`sort()\` returning \`None\`, the bare \`except\` that hides real bugs — because those are what actually cost people afternoons.`,
    coverEmoji: "🐍",
    level: "BEGINNER",
    tags: ["python", "programming", "backend", "data"],
    dir: "python-basics",
  },
  {
    slug: "java-basics",
    title: "Java Essentials",
    summary:
      "Static types, objects and collections — what every Java framework assumes you know.",
    description: `Java asks for more ceremony than a scripting language, and the ceremony is the point: everything has a declared type and the compiler checks the whole program before a line runs.

We start at \`public static void main\` and work through the type system, control flow, methods, classes, inheritance and interfaces, the Collections Framework, and exceptions.

This is the layer Spring, Android and the streams API all sit on top of. It is marked intermediate not because it is hard, but because static typing and object modelling are a genuine step up from a first scripting language.`,
    coverEmoji: "☕",
    level: "INTERMEDIATE",
    tags: ["java", "programming", "backend", "oop"],
    dir: "java-basics",
  },
];
