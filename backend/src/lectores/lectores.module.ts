import { Module } from '@nestjs/common';
import { LectoresService } from './lectores.service';
import { LectoresController } from './lectores.controller';

@Module({
  controllers: [LectoresController],
  providers: [LectoresService],
})
export class LectoresModule {}
