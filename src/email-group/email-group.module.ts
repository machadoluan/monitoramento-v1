import { Module } from '@nestjs/common';
import { EmailGroupService } from './email-group.service';
import { EmailGroupController } from './email-group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailGroup } from './email-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailGroup])],
  providers: [EmailGroupService],
  controllers: [EmailGroupController],
  exports: [EmailGroupService]
})
export class EmailGroupModule { }
