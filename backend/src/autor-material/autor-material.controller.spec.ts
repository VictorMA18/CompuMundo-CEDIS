import { Test, TestingModule } from '@nestjs/testing';
import { AutorMaterialController } from './autor-material.controller';

describe('AutorMaterialController', () => {
  let controller: AutorMaterialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutorMaterialController],
    }).compile();

    controller = module.get<AutorMaterialController>(AutorMaterialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
