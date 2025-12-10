import { Expose } from 'class-transformer';
import { IsOptional, IsDateString } from 'class-validator';

export class TransactionHistoryQueryDto {
  @Expose()
  @IsOptional()
  @IsDateString()
  public fromDate?: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  public toDate?: string;
}

