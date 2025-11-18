import { Test, TestingModule } from '@nestjs/testing';
import { MaterialFisicoController } from './material-fisico.controller';
import { MaterialFisicoService } from './material-fisico.service';

describe('MaterialFisicoController', () => {
  let controller: MaterialFisicoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialFisicoController],
      providers: [MaterialFisicoService],
    }).compile();

    controller = module.get<MaterialFisicoController>(MaterialFisicoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
