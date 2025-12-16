const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const forceReset =
    (process.env.SEED_FORCE_RESET_ADMIN_PASSWORD || '').toLowerCase() === 'true';

  // DEBUG (no imprimir password real en logs)
  console.log('[seed] adminEmail:', adminEmail);
  console.log('[seed] forceReset:', forceReset);
  console.log('[seed] adminPassword (masked):', '*'.repeat(String(adminPassword).length));

  const admin = await prisma.tB_USUARIO.findUnique({
    where: { UsuEma: adminEmail },
  });

  const hashed = await bcrypt.hash(adminPassword, 10);

  if (!admin) {
    await prisma.tB_USUARIO.create({
      data: {
        UsuNom: 'Administrador',
        UsuEma: adminEmail,
        UsuCon: hashed,
        UsuTip: 'administrador',
        UsuAct: true,
      },
    });
    console.log('Usuario administrador creado');
  } else {
    console.log('El usuario administrador ya existe');

    if (forceReset) {
      await prisma.tB_USUARIO.update({
        where: { UsuEma: adminEmail },
        data: {
          UsuCon: hashed,
          UsuAct: true,
          UsuTip: 'administrador',
        },
      });
      console.log(
        'Admin actualizado (password/act/tipo) por SEED_FORCE_RESET_ADMIN_PASSWORD=true',
      );
    }
  }

  const categorias = [
    { CatNom: 'Libro', CatDes: 'Material bibliográfico de lectura extensa' },
    { CatNom: 'Artículo', CatDes: 'Documento breve de carácter informativo o científico' },
    { CatNom: 'Tesis', CatDes: 'Trabajo académico de investigación' },
  ];

  for (const cat of categorias) {
    await prisma.tB_CATEGORIA.upsert({
      where: { CatNom: cat.CatNom },
      update: {},
      create: { ...cat, CatAct: true },
    });
  }

  console.log('Categorías base insertadas');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });