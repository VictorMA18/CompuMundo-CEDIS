import { Test, TestingModule } from '@nestjs/testing';
import { MaterialBibliograficoService } from './material-bibliografico.service';

describe('MaterialBibliograficoService', () => {
  let service: MaterialBibliograficoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialBibliograficoService],
    }).compile();

    service = module.get<MaterialBibliograficoService>(MaterialBibliograficoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
