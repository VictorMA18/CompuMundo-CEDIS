import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@admin.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  const admin = await prisma.tB_USUARIO.findUnique({ where: { UsuEma: adminEmail } });

  if (!admin) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await prisma.tB_USUARIO.create({
      data: {
        UsuNom: 'Administrador',
        UsuEma: adminEmail,
        UsuCon: hashed,
        UsuTip: 'administrador',
        UsuAct: true,
      },
    });
  } else {
    console.log('El usuario administrador ya existe');
  }

  // Categorías base
  const categorias = [
    { CatNom: 'Libro', CatDes: 'Material bibliográfico de lectura extensa' },
    { CatNom: 'Artículo', CatDes: 'Documento breve de carácter informativo o científico' },
    { CatNom: 'Tesis', CatDes: 'Trabajo académico de investigación' },
  ];
  
  for (const cat of categorias) {
    await prisma.tB_CATEGORIA.upsert({ // Usamos upsert para evitar duplicados. Si la categoría ya existe por nombre, no la crea de nuevo (update vacío). Si no existe, la crea.
      where: { CatNom: cat.CatNom },
      update: {},
      create: {
        CatNom: cat.CatNom,
        CatDes: cat.CatDes,
        CatAct: true,
      },
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
