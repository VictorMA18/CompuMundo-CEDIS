import { Test, TestingModule } from '@nestjs/testing';
import { MaterialVirtualService } from './material-virtual.service';

describe('MaterialVirtualService', () => {
  let service: MaterialVirtualService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialVirtualService],
    }).compile();

    service = module.get<MaterialVirtualService>(MaterialVirtualService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
