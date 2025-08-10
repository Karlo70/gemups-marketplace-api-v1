import {
  registerDecorator,
  ValidationArguments,
  ValidationError,
} from 'class-validator';
import { extractKeys } from 'src/utils/extract-keys-from-create-assistant-file';

export class BaseCreateAgentDto {}

const unwrap = (val: any): any => {
  if (val === undefined || val === null) return val;

  if (typeof val === 'object') {
    if ('variants' in val) return unwrap(val.variants[0]);
    if ('type' in val) return unwrap(val.type);
  }
  return val;
};

const isRequired = (val: any): boolean =>
  typeof val === 'object' && val?.required === true;

function objectToArray(obj: any) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const keys = Object.keys(obj);
  // Only treat as array if all keys are numeric (can adapt this if needed)
  if (keys.every((k) => /^\d+$/.test(k))) {
    return keys
      .toSorted((a, b) => Number(a) - Number(b))
      .map((key) => objectToArray(obj[key]))
      .filter((item) => item !== undefined); // remove undefined items
  }
  // Otherwise, recurse through all keys
  const newObj = {};
  for (const k of keys) {
    newObj[k] = objectToArray(obj[k]);
  }
  return newObj;
}

export function inferValidator(value: any): {
  validate: (val: any, args?: any) => boolean;
  message: any;
} {
  const type = unwrap(value);

  // === Basic Types ===
  if (type === String)
    return {
      validate: (v) => typeof v === 'string',
      message: 'must be a string',
    };
  if (type === Number)
    return {
      validate: (v) => typeof v === 'number',
      message: 'must be a number',
    };
  if (type === Boolean)
    return {
      validate: (v) => typeof v === 'boolean',
      message: 'must be a boolean',
    };
  if (type === 'string[]')
    return {
      validate: (v) =>
        Array.isArray(v) && v.every((e) => typeof e === 'string'),
      message: 'must be an array of strings',
    };

  // === Enum-style literals ===
  if (
    Array.isArray(value?.type?.variants) &&
    value.type.variants.every((v) => typeof v === 'string')
  ) {
    const allowed = value.type.variants;
    return {
      validate: (v) => allowed.includes(v),
      message: `must be one of: ${allowed.join(', ')}`,
    };
  }

  // === Object-based Variants ===
  if (Array.isArray(value?.type?.variants)) {
    const variants = value.type.variants;

    return {
      validate(val: any, args?: any) {
        args = args ?? {};

        if (typeof val !== 'object' || val === null) {
          args.constraints = { dynamicValidator: 'value must be an object' };
          return false;
        }

        const identifierKey =
          Object.keys(variants[0] ?? {}).find(
            (k) => typeof unwrap(variants[0][k]) === 'string',
          ) ?? 'provider';
        const inputValue = val?.[identifierKey];

        const allowed = variants.map((v) => unwrap(v?.[identifierKey]));

        if (!inputValue || !allowed.includes(inputValue)) {
          args.children = [
            {
              property: identifierKey,
              constraints: {
                dynamicValidator: `Invalid ${identifierKey} "${inputValue}", must be one of: ${allowed.join(', ')}`,
              },
              children: [],
            },
          ];
          return false;
        }

        const matched = variants.find(
          (v) => unwrap(v?.[identifierKey]) === inputValue,
        );
        const validator = inferValidator(matched);

        if (typeof validator.message === 'object') {
          const children: ValidationError[] = [];

          for (const [k, _] of Object.entries(validator.message)) {
            const valField = val?.[k];
            const schemaField = matched[k];
            // console.log("🚀 ~ validate ~ schemaField:", schemaField.type["transcribers"]?.type[0].variants)
            const fieldValidator = inferValidator(schemaField);
            const required = isRequired(schemaField);

            if (!(k in val) && required) {
              children.push({
                property: k,
                constraints: { dynamicValidator: 'missing required field' },
                children: [],
              });
            } else if (
              valField !== undefined &&
              !fieldValidator.validate(valField, args)
            ) {
              children.push({
                property: k,
                constraints: { dynamicValidator: fieldValidator.message },
                children: args.children ?? [],
              });
            }
          }

          if (children.length) {
            args.children = children;
            return false;
          }
        }

        return validator.validate(val, args);
      },

      message(val: any) {
        const identifierKey =
          Object.keys(variants[0] ?? {}).find(
            (k) => typeof unwrap(variants[0][k]) === 'string',
          ) ?? 'provider';
        const inputValue = val?.[identifierKey];
        const allowed = variants.map((v) => unwrap(v?.[identifierKey]));

        if (!inputValue || !allowed.includes(inputValue)) {
          return {
            [identifierKey]: `invalid ${identifierKey} "${inputValue}", must be one of: ${allowed.join(', ')}`,
          };
        }

        const matched = variants.find(
          (v) => unwrap(v?.[identifierKey]) === inputValue,
        );
        const validator = inferValidator(matched);

        if (typeof validator.message === 'object') {
          const messages: Record<string, any> = {};
          for (const [k, _] of Object.entries(validator.message)) {
            const valField = val?.[k];
            const fieldValidator = inferValidator(matched[k]);
            if (valField !== undefined && !fieldValidator.validate(valField)) {
              messages[k] = fieldValidator.message;
            }
          }
          return messages;
        }

        return {
          [identifierKey]:
            validator.message ?? `invalid object for selected ${identifierKey}`,
        };
      },
    };
  }

  // === Object schema ===
  if (type && typeof type === 'object') {
    const fieldValidators = Object.entries(type).map(([k, v]) => [
      k,
      inferValidator(v),
    ]);
    const requiredFields = Object.entries(type).map(([k, v]) => [
      k,
      isRequired(v),
    ]);

    return {
      validate: (v) =>
        typeof v === 'object' &&
        v !== null &&
        fieldValidators.every(([k, validator]: any) =>
          k in v
            ? validator.validate(v[k])
            : !requiredFields.find(([rk]) => rk === k)?.[1],
        ),
      message: objectToArray(
        Object.fromEntries(
          fieldValidators.map(([k, v]: any) => [k, v.message]),
        ),
      ),
    };
  }

  // === Literal Match ===
  if (typeof type === 'string') {
    return { validate: (v) => v === type, message: `must be "${type}"` };
  }

  // === Unknown fallback ===
  return {
    validate: () => false,
    message: 'type is unknown or not validated',
  };
}

export function createDynamicValidatedDtoClass() {
  const { keyObject } = extractKeys('Vapi.CreateAssistantDto');
  class DynamicAgentDto extends BaseCreateAgentDto {}

  for (const [key, schema] of Object.entries(keyObject)) {
    const validator = inferValidator(schema);
    const required = isRequired(schema);

    registerDecorator({
      name: 'dynamicValidator',
      target: DynamicAgentDto.prototype.constructor,
      propertyName: key,
      options: {
        message: (args: ValidationArguments) =>
          typeof validator.message === 'function'
            ? JSON.stringify(validator.message(args.value))
            : JSON.stringify(validator.message),
      },

      validator: {
        validate(value: any, args: any) {
          if (!required && (value === undefined || value === null)) return true;

          if (typeof validator.message === 'object') {
            const children: ValidationError[] = [];

            const variant =
              schema?.['type']?.['variants']?.[0] ?? schema?.['type'];

            for (const [k, _] of Object.entries(validator.message)) {
              const val = value?.[k];
              const fieldSchema = variant?.[k];
              const fieldValidator = inferValidator(fieldSchema);
              const fieldRequired = isRequired(fieldSchema);

              if (!(k in value) && fieldRequired) {
                children.push({
                  property: k,
                  constraints: { dynamicValidator: 'missing required field' },
                });
              } else if (!fieldValidator.validate(val)) {
                children.push({
                  property: k,
                  constraints: { dynamicValidator: fieldValidator.message },
                });
              }
            }

            if (children.length) {
              args.children = children;
              return false;
            }
          }

          return validator.validate(value);
        },
        defaultMessage(args: ValidationArguments) {
          return typeof validator.message === 'function'
            ? JSON.stringify(validator.message(args.value))
            : JSON.stringify(validator.message);
        },
      },
    });
  }

  return DynamicAgentDto;
}

export const CreateAgentDto = createDynamicValidatedDtoClass();
export type CreateAgentDto = InstanceType<typeof CreateAgentDto>;


// export class CreateAgentDto extends BaseCreateAgentDto {}
