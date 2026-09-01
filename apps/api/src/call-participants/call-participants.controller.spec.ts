import { Test, TestingModule } from '@nestjs/testing';
import { CallParticipantsController } from './call-participants.controller';

describe('CallParticipantsController', () => {
  let controller: CallParticipantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CallParticipantsController],
    }).compile();

    controller = module.get<CallParticipantsController>(
      CallParticipantsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
