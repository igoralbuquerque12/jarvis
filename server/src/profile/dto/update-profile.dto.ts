import type { CreateProfileDto } from './create-profile.dto';

export type UpdateProfileDto = Omit<Partial<CreateProfileDto>, 'userId'>;
