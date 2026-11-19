import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DATE_REGEX, MONTH_REGEX } from '../../common/dates';
import { TransactionType } from '../transactions.entity';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// El máximo que entra en decimal(10, 2)
const MAX_AMOUNT = 99_999_999.99;

export class CreateTransactionDto {
  @IsEnum(TransactionType, { message: "type debe ser 'income' o 'expense'" })
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_AMOUNT)
  amount: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  description?: string;

  // Si no se manda, la base usa la fecha de hoy
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'date debe tener formato YYYY-MM-DD' })
  date?: string;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionType, { message: "type debe ser 'income' o 'expense'" })
  type?: TransactionType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(MAX_AMOUNT)
  amount?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'date debe tener formato YYYY-MM-DD' })
  date?: string;
}

// Filtros para GET /transactions?from=...&to=...&type=...
export class ListTransactionsQueryDto {
  @IsOptional()
  @Matches(DATE_REGEX, { message: 'from debe tener formato YYYY-MM-DD' })
  from?: string;

  @IsOptional()
  @Matches(DATE_REGEX, { message: 'to debe tener formato YYYY-MM-DD' })
  to?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  // De dónde vino: 'dashboard', 'whatsapp' o 'telegram'
  @IsOptional()
  @IsIn(['dashboard', 'whatsapp', 'telegram'])
  source?: string;

  // Busca en descripción y categoría
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Los query params llegan como string: @Type los convierte a número
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;
}

export class MonthQueryDto {
  @IsOptional()
  @Matches(MONTH_REGEX, { message: 'month debe tener formato YYYY-MM' })
  month?: string;
}
