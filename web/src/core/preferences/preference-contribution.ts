import { PreferenceSchema } from './preference-types';

export interface PreferenceContribution {
  schema: PreferenceSchema;
}

export const PreferenceContribution = Symbol('PreferenceContribution');