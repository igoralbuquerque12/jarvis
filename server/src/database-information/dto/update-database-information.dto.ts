import { CreateDatabaseInformationDto } from './create-database-information.dto';

/** Only the content is editable; name and description are always re-extracted. */
export class UpdateDatabaseInformationDto extends CreateDatabaseInformationDto {}
