import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: "super_admin", level: 100 },
      { name: "owner", level: 90 },
      { name: "hr", level: 70 },
      { name: "security", level: 60 },
      { name: "manager", level: 50 },
      { name: "worker", level: 10 }
    ],
    skipDuplicates: true
  });

  console.log("Roles creados correctamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });