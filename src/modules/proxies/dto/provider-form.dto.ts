export interface ProviderFormField {
  name: string;
  type: 'string' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  label: string;
  placeholder?: string;
  options?: { value: any; label: string }[];
  validation?: string;
  description?: string;
}

export interface ProviderForm {
  provider: string;
  fields: ProviderFormField[];
  description: string;
}

export class GetProviderFormDto {
  provider: string;
}
