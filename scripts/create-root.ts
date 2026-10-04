import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "hemantkumar7448874@gmail.com";
  const password = "ApexTrack@Apek123";
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { isRoot: true, passwordHash }
    });
    console.log("User already exists. Updated to root user and reset password.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  const org = await prisma.organization.create({
    data: { name: "ApexTrack Super Admins" }
  });
  
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      isRoot: true,
      organizationId: org.id
    }
  });
  
  console.log("Root user created successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
