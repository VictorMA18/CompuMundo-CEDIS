import { Test, TestingModule } from '@nestjs/testing';
import { LectoresController } from './lectores.controller';
import { LectoresService } from './lectores.service';

describe('LectoresController', () => {
  let controller: LectoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LectoresController],
      providers: [LectoresService],
    }).compile();

    controller = module.get<LectoresController>(LectoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
