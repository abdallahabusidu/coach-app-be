import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CertificateInfoDto {
  @ApiProperty({
    description: 'Name of the certification',
    example: 'NASM Certified Personal Trainer',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Organization that issued the certification',
    example: 'National Academy of Sports Medicine',
    required: true,
  })
  @IsString()
  issuer: string;

  @ApiProperty({
    description: 'Year the certification was obtained',
    example: 2020,
    required: true,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'Description or additional details about the certification',
    example:
      'CPT certification focused on corrective exercise and program design',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CertificatesUploadDto {
  @ApiProperty({
    description: 'Array of file uploads for certificates',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: true,
  })
  files: any[];

  @ApiProperty({
    description:
      'JSON string containing information about each certificate being uploaded',
    example: JSON.stringify([
      {
        name: 'NASM CPT',
        issuer: 'National Academy of Sports Medicine',
        year: 2020,
        description: 'Certified Personal Trainer',
      },
      {
        name: 'Precision Nutrition Level 1',
        issuer: 'Precision Nutrition',
        year: 2021,
      },
    ]),
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificateInfoDto)
  certificatesInfo: CertificateInfoDto[];
}
