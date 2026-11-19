import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
} from 'class-validator';
import { MONTH_REGEX } from '../../common/dates';

export class CreateBudgetDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99_999_999.99)
  limit: number;

  @Matches(MONTH_REGEX, { message: 'month debe tener formato YYYY-MM' })
  month: string;
}

export class UpdateBudgetDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99_999_999.99)
  limit: number;
}
