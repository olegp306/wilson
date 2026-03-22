import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AssignManagerDto {
  @ApiPropertyOptional({
    description: 'Manager employee id within the same tenant; omit or null to clear',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  managerId?: string | null;
}
