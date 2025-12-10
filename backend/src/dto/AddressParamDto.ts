import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class AddressParamDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(addr1|addr_test1)[a-z0-9]{5,}$/, {
    message: 'address must be a valid bech32 Cardano address',
  })
  public address!: string;
}

