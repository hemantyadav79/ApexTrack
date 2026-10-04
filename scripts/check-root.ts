import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: "hemantkumar7448874@gmail.com" } });
  console.log("isRoot in DB:", user?.isRoot);
}
main();
