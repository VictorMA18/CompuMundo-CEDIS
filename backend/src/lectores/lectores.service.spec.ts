import { Test, TestingModule } from '@nestjs/testing';
import { LectoresService } from './lectores.service';

describe('LectoresService', () => {
  let service: LectoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LectoresService],
    }).compile();

    service = module.get<LectoresService>(LectoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
