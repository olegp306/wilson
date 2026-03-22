import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class PatchIntegrationDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
