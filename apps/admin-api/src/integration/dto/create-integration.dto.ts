import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateIntegrationDto {
  @ApiProperty({ enum: IntegrationKind, example: 'EMAIL' })
  @IsEnum(IntegrationKind)
  kind!: IntegrationKind;

  @ApiPropertyOptional({
    description: 'When set, integration applies to this employee; omit for tenant-wide defaults',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiProperty({ example: 'GENERIC_IMAP' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  provider!: string;

  @ApiProperty({ example: 'Work inbox (IMAP)' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName!: string;

  @ApiProperty({
    description:
      'JSON string for credentials (IMAP: host/port/user/password; Google Calendar: clientId/clientSecret/refreshToken). Not encrypted in MVP — use only in trusted environments.',
    example: '{"host":"imap.example.com","port":993,"user":"u","password":"p","secure":true}',
  })
  @IsString()
  @MinLength(1)
  encryptedSecret!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
