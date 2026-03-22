import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class MailDraftReplyRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  messageId?: string;

  @IsOptional()
  @IsIn(['professional', 'casual', 'brief'])
  tone?: 'professional' | 'casual' | 'brief';
}
