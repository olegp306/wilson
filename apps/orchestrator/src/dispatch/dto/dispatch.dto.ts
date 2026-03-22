import { ApiProperty } from '@nestjs/swagger';
import { ORCHESTRATOR_COMMAND_TYPES, type OrchestratorCommandType } from '@wilson/event-contracts';
import { IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class DispatchRequestDto {
  @ApiProperty({ enum: [...ORCHESTRATOR_COMMAND_TYPES] })
  @IsIn([...ORCHESTRATOR_COMMAND_TYPES])
  type!: OrchestratorCommandType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ required: false, description: 'JSON payload for the command' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
