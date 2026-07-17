import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10,15}$/, {
    message:
      'phone must contain only numbers, include country code, and have 10 to 15 digits.',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
