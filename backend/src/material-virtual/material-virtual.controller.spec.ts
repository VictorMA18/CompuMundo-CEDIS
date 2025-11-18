import { Test, TestingModule } from '@nestjs/testing';
import { MaterialVirtualController } from './material-virtual.controller';
import { MaterialVirtualService } from './material-virtual.service';

describe('MaterialVirtualController', () => {
  let controller: MaterialVirtualController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialVirtualController],
      providers: [MaterialVirtualService],
    }).compile();

    controller = module.get<MaterialVirtualController>(MaterialVirtualController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
