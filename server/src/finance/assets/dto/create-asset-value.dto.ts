import { IsNumber, Matches, Min } from 'class-validator';
import { ISO_DATE_PATTERN } from '../../core/constants/securo-vocab.constant';

export class CreateAssetValueDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @Matches(ISO_DATE_PATTERN)
  date: string;
}
