import { JSONValue } from '@lumino/coreutils';
import { JSONSchema7 } from 'json-schema';
export type JsonType = 'string' | 'array' | 'number' | 'integer' | 'object' | 'boolean' | 'null';
/**
 * extended JSON schema
 */
export interface IJSONSchema extends JSONSchema7 {
}
export interface IJSONSchemaMap {
    [name: string]: IJSONSchema;
}
export interface IJSONSchemaSnippet {
    label?: string;
    description?: string;
    body?: JSONValue;
    bodyText?: string;
}
