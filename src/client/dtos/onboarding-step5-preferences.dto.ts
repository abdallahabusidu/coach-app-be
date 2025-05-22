import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum CoachGenderPreference {
  MALE = 'Male',
  FEMALE = 'Female',
  NO_PREFERENCE = 'No Preference',
}
export enum CoachingMode {
  IN_PERSON = 'In-Person',
  ONLINE = 'Online',
  EITHER = 'Either',
}
export enum PreferredTime {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening',
  FLEXIBLE = 'Flexible',
}

export class OnboardingStep5PreferencesDto {
  @ApiProperty({ enum: CoachGenderPreference })
  @IsEnum(CoachGenderPreference)
  coachGenderPreference: CoachGenderPreference;

  @ApiProperty({ enum: CoachingMode })
  @IsEnum(CoachingMode)
  coachingMode: CoachingMode;

  @ApiProperty({
    description: 'Budget for coaching services',
    example: '100-200',
    required: false,
  })
  @IsOptional()
  @IsString()
  budget?: string;

  @ApiProperty({ enum: PreferredTime })
  @IsEnum(PreferredTime)
  preferredTime: PreferredTime;
}
