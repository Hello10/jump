import {get, difference} from 'lodash';

import expose from './expose';

// We group definitions by their kind and also build up some enums that
// can be written to the shared package so we can use those instead of
// magic strings in the applications
function processDefinitions (definitions) {
  const enums = {};
  const groups = {
    Query: [],
    Mutation: [],
    Type: []
  };

  for (const definition of definitions) {
    const {kind} = definition;
    const name = get(definition, 'name.value');
    if (!name) {
      continue;
    }

    switch (kind) {
      case 'ScalarTypeDefinition':
      case 'InterfaceTypeDefinition':
      case 'UnionTypeDefinition':
        groups.Type.push(name);
        break;

      case 'EnumTypeDefinition': {
        const {values} = definition;
        enums[name] = values.reduce((result, value_definition)=> {
          const {value} = value_definition.name;
          result[value] = value;
          return result;
        }, {});
        break;
      }

      case 'ObjectTypeDefinition': {
        const is_query_or_mutation = ['Query', 'Mutation'].includes(name);
        if (is_query_or_mutation) {
          const {fields} = definition;
          for (const field of fields) {
            const {value} = field.name;
            groups[name].push(value);
          }
        } else {
          groups.Type.push(name);
        }
        break;
      }

      default:
        break;
    }
  }

  return {enums, groups};
}

// TODO: handle checking resolved type fields as well by using @ref directive
function checkSchema ({groups: schema_groups, resolvers}) {
  const resolver_groups = Object.entries(resolvers).reduce((names, [k, v])=> {
    if (k in names) {
      names[k] = Object.keys(v);
    } else {
      names.Type.push(k);
    }
    return names;
  }, {
    Type: [],
    Query: null,
    Mutation: null
  });

  return Object.entries(schema_groups).reduce((errors, [kind, schema_names])=> {
    const resolver_names = resolver_groups[kind];
    const differences = {
      resolver: difference(schema_names, resolver_names),
      schema: difference(resolver_names, schema_names)
    };

    return Object.entries(differences).reduce((errors, [source, diff])=> {
      const new_errors = diff.map((name)=>
        `Missing ${source} for ${name}`
      );
      return [...errors, ...new_errors];
    }, errors);
  }, []);
}

export default function processSchema ({Schema, Controllers, Scalars}) {
  const resolvers = expose({Controllers, Scalars});
  const {definitions} = Schema;
  const {enums, groups} = processDefinitions(definitions);
  const errors = checkSchema({resolvers, groups});
  return {enums, groups, errors};
}
