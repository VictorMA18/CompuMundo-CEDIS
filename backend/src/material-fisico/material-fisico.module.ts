import { Module } from '@nestjs/common';
import { MaterialFisicoService } from './material-fisico.service';
import { MaterialFisicoController } from './material-fisico.controller';
import { MaterialBibliograficoModule } from '../material-bibliografico/material-bibliografico.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [MaterialBibliograficoModule, PrismaModule],
  controllers: [MaterialFisicoController],
  providers: [MaterialFisicoService]
})
export class MaterialFisicoModule {}