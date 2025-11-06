import { Module } from '@nestjs/common';
import { LectoresService } from './lectores.service';
import { LectoresController } from './lectores.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LectoresController],
  providers: [LectoresService],
})
export class LectoresModule {}
