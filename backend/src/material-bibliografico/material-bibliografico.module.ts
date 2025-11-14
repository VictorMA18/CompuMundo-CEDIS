import { Module } from '@nestjs/common';
import { MaterialBibliograficoService } from './material-bibliografico.service';
import { MaterialBibliograficoController } from './material-bibliografico.controller';
import { AutorMaterialService } from 'src/autor-material/autor-material.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AutorMaterialModule } from 'src/autor-material/autor-material.module';

@Module({
  imports: [PrismaModule, AutorMaterialModule],
  controllers: [MaterialBibliograficoController],
  providers: [MaterialBibliograficoService],
})
export class MaterialBibliograficoModule {}
