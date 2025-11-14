import { Test, TestingModule } from '@nestjs/testing';
import { AutorController } from './autor.controller';

describe('AutorController', () => {
  let controller: AutorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutorController],
    }).compile();

    controller = module.get<AutorController>(AutorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
