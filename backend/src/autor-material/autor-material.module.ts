import { Module } from '@nestjs/common';
import { AutorMaterialService } from './autor-material.service';
import { AutorMaterialController } from './autor-material.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AutorMaterialService],
  controllers: [AutorMaterialController],
  exports: [AutorMaterialService]
})
export class AutorMaterialModule {}
