import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";
import { runDevScan } from "../src/lib/devscan/runScan";

runDevScan()
  .then(({ digestBody }) => console.log(digestBody))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
