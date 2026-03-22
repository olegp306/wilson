import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAgentConfigDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
