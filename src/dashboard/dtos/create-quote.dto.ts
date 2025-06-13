import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'The quote text',
    example: 'The only way to do great work is to love what you do.',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Author of the quote',
    example: 'Steve Jobs',
  })
  @IsString()
  author: string;

  @ApiProperty({
    description: 'Category of the quote',
    example: 'motivation',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Whether the quote is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
