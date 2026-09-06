/**
 * Latent personas for synthetic learners.
 *
 * This is the most important file in the seed. The ML ranker in M9 learns from
 * these histories, so the histories must contain RECOVERABLE SIGNAL: a learner
 * who finishes JavaScript should demonstrably tend to open CSS next, not a
 * uniformly random course. Randomised history trains a model to AUC ~= 0.5 and
 * there is nothing to demo.
 *
 * `courseOrder` is the preference ordering the recommender is supposed to
 * rediscover from behaviour alone. It is never stored in the database.
 */
export type Persona = {
  id: string;
  label: string;
  /** Course slugs in the order this persona tends to take them. */
  courseOrder: string[];
  /** Reading speed as a multiple of the 200 wpm baseline. */
  speed: number;
  /** How many courses past the first they typically start. */
  breadth: number;
  /** Probability of finishing a course they start. */
  completion: number;
  /** Typical chapters consumed in one sitting. */
  chaptersPerSession: [number, number];
  /** Modal hour of day (local) they study. */
  hour: number;
  /** Share of the 60 synthetic learners assigned this persona. */
  weight: number;
};

export const PERSONAS: Persona[] = [
  {
    id: "frontend",
    label: "Frontend track",
    courseOrder: ["javascript-fundamentals", "css-layout", "git-github-basics"],
    speed: 1.0,
    breadth: 2,
    completion: 0.85,
    chaptersPerSession: [2, 4],
    hour: 20,
    weight: 0.27,
  },
  {
    id: "backend",
    label: "Backend / data track",
    courseOrder: ["sql-for-beginners", "git-github-basics", "javascript-fundamentals"],
    speed: 0.9,
    breadth: 2,
    completion: 0.8,
    chaptersPerSession: [2, 3],
    hour: 10,
    weight: 0.25,
  },
  {
    id: "tooling",
    label: "Tooling first",
    courseOrder: ["git-github-basics", "javascript-fundamentals", "sql-for-beginners"],
    speed: 1.15,
    breadth: 1,
    completion: 0.7,
    chaptersPerSession: [1, 3],
    hour: 14,
    weight: 0.15,
  },
  {
    id: "binger",
    label: "Binge reader",
    courseOrder: ["javascript-fundamentals", "sql-for-beginners", "css-layout", "git-github-basics"],
    speed: 1.35,
    breadth: 3,
    completion: 0.9,
    chaptersPerSession: [4, 7],
    hour: 23,
    weight: 0.12,
  },
  {
    id: "skimmer",
    label: "Skimmer",
    courseOrder: ["css-layout", "javascript-fundamentals"],
    speed: 1.9,
    breadth: 2,
    completion: 0.3,
    chaptersPerSession: [1, 2],
    hour: 12,
    weight: 0.11,
  },
  {
    id: "dabbler",
    label: "Dabbler (abandons)",
    courseOrder: ["sql-for-beginners", "css-layout"],
    speed: 0.75,
    breadth: 1,
    completion: 0.05,
    chaptersPerSession: [1, 2],
    hour: 18,
    weight: 0.1,
  },
];

/** Deterministic PRNG (mulberry32) so re-seeding reproduces the same dataset. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickPersona(r: number): Persona {
  let acc = 0;
  for (const p of PERSONAS) {
    acc += p.weight;
    if (r <= acc) return p;
  }
  return PERSONAS[PERSONAS.length - 1];
}
