import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@admin.com';
  const adminExists = await prisma.tB_USUARIO.findUnique({
    where: { UsuEma: adminEmail },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.tB_USUARIO.create({
      data: {
        UsuNom: 'Administrador',
        UsuEma: adminEmail,
        UsuCon: hashedPassword,
        UsuTip: 'administrador',
        UsuAct: true,
      },
    });
    console.log('Usuario administrador creado');
  } else {
    console.log('El usuario administrador ya existe');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
