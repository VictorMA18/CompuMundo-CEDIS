import { Module } from '@nestjs/common';
import { MaterialBibliograficoService } from './material-bibliografico.service';
import { MaterialBibliograficoController } from './material-bibliografico.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AutorMaterialModule } from 'src/autor-material/autor-material.module';
import { CategoriasModule } from 'src/categorias/categorias.module';
import { AutorModule } from 'src/autor/autor.module';

@Module({
  imports: [PrismaModule, AutorMaterialModule, CategoriasModule, AutorModule],
  controllers: [MaterialBibliograficoController],
  providers: [MaterialBibliograficoService],
  exports: [MaterialBibliograficoService]
})
export class MaterialBibliograficoModule {}
