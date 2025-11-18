import { Module } from '@nestjs/common';
import { MaterialVirtualService } from './material-virtual.service';
import { MaterialVirtualController } from './material-virtual.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MaterialBibliograficoModule } from 'src/material-bibliografico/material-bibliografico.module';

@Module({
  imports: [MaterialBibliograficoModule,PrismaModule],
  controllers: [MaterialVirtualController],
  providers: [MaterialVirtualService],
})
export class MaterialVirtualModule {}
