import "dotenv/config";
import bcrypt from "bcryptjs";

import { db } from "../src/lib/db";

const USERS = [
  { email: "student@demo.com", name: "Demo Student", role: "STUDENT" as const },
  { email: "admin@demo.com", name: "Demo Admin", role: "ADMIN" as const },
];

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  for (const u of USERS) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { ...u, passwordHash },
      select: { id: true, email: true, role: true },
    });
    console.log("ready:", user.email, user.role);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
