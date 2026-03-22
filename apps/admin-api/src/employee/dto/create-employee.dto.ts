import { ApiProperty } from '@nestjs/swagger';
import { EmployeeRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiProperty({ enum: EmployeeRole, default: EmployeeRole.MEMBER })
  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;
}
