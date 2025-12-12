import { Test, TestingModule } from '@nestjs/testing';
import { MaterialBibliograficoController } from './material-bibliografico.controller';
import { MaterialBibliograficoService } from './material-bibliografico.service';

describe('MaterialBibliograficoController', () => {
  let controller: MaterialBibliograficoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialBibliograficoController],
      providers: [MaterialBibliograficoService],
    }).compile();

    controller = module.get<MaterialBibliograficoController>(MaterialBibliograficoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
