import { Test, TestingModule } from '@nestjs/testing';
import { AutorMaterialService } from './autor-material.service';

describe('AutorMaterialService', () => {
  let service: AutorMaterialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutorMaterialService],
    }).compile();

    service = module.get<AutorMaterialService>(AutorMaterialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
