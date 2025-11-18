import { Test, TestingModule } from '@nestjs/testing';
import { MaterialFisicoService } from './material-fisico.service';

describe('MaterialFisicoService', () => {
  let service: MaterialFisicoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialFisicoService],
    }).compile();

    service = module.get<MaterialFisicoService>(MaterialFisicoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
