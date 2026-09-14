import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendSelfMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message: string;
}
