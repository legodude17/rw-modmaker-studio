import { createContext, useContext, memo } from 'react';
import { List } from 'immutable';
import { IMaskInput } from 'react-imask';
import { Def, Field } from '../Project';
import SimpleText from './SimpleText';
import { TypeInfo } from '../completionItem';
import { DispatchContext } from '../misc';
import PathedCheckbox from './PathedCheckbox';
import {
  allChildren,
  allDefsOfType,
  DataContext,
  fullType,
  typeByName,
} from '../DataManager';
import SimpleAutocomplete from './SimpleAutocomplete';

export const DefsContext = createContext([] as Def[]);

function SingleFieldInput({
  field,
  path,
  typeInfo,
  type = 'value',
  typePath,
}: {
  field: Field;
  path: string[];
  typeInfo: TypeInfo;
  type?: 'value' | 'key';
  typePath: string;
}) {
  const dispatch = useContext(DispatchContext);
  const data = useContext(DataContext);
  const defs = useContext(DefsContext);
  if (typeof field.get(type) !== 'string') return null;
  if (typeInfo?.specialType?.string) {
    return (
      <SimpleText
        style={{ flexGrow: 1 }}
        multiline={
          field.key === 'description' ||
          field.key.toLowerCase().includes('text')
        }
        value={field.get(type) as string}
        path={path.concat(type)}
      />
    );
  }
  if (typeInfo?.specialType?.float) {
    return (
      <SimpleText
        style={{ flexGrow: 1 }}
        error={(text) => Number.isNaN(Number(text))}
        helperText={(text) =>
          Number.isNaN(Number(text)) ? 'Must enter a number' : ''
        }
        textFieldProps={{ InputProps: { type: 'number' } }}
        value={field.get(type) as string}
        path={path.concat(type)}
      />
    );
  }
  if (typeInfo?.specialType?.integer) {
    return (
      <SimpleText
        style={{ flexGrow: 1 }}
        error={(text) =>
          Number.isNaN(Number(text)) || Number(text) !== parseInt(text, 10)
        }
        helperText={(text) =>
          Number.isNaN(Number(text)) || Number(text) !== parseInt(text, 10)
            ? 'Must enter an integer'
            : ''
        }
        textFieldProps={{ InputProps: { type: 'number' } }}
        value={field.get(type) as string}
        path={path.concat(type)}
      />
    );
  }
  if (
    typeInfo?.specialType?.customFormats &&
    typeInfo.specialType?.customFormats.length
  ) {
    return (
      <SimpleText
        style={{ flexGrow: 1 }}
        textFieldProps={{
          InputProps: {
            inputComponent: IMaskInput,
            inputProps: {
              mask: typeInfo.specialType.customFormats[0].replace(
                /\$[a-z]/g,
                (text) => '0'.repeat(text.length)
              ),
            },
          },
        }}
        value={field.get(type) as string}
        path={path.concat(type)}
      />
    );
  }
  if (typeInfo.specialType?.enum) {
    const opts = typeInfo.leafNodeCompletions.map((item) => item.label);
    return (
      <SimpleAutocomplete
        options={opts ?? []}
        path={path.concat(type)}
        value={field.get(type) as string}
      />
    );
  }
  if (typeInfo.specialType?.bool) {
    return (
      <PathedCheckbox
        path={path.concat(type)}
        startingValue={(field.get(type) as string).toLowerCase() === 'true'}
      />
    );
  }
  if (typeInfo.typeIdentifier === 'System.Type') {
    const parentTypeName = data.parents[typePath];
    const parentTypeInfo = typeByName(parentTypeName);
    const opts = allChildren(parentTypeInfo)?.map((t) =>
      t.typeIdentifier.replace('RimWorld.', '').replace('Verse.', '')
    );
    return (
      <SimpleAutocomplete
        options={opts ?? []}
        path={path.concat(type)}
        value={field.get(type) as string}
      />
    );
  }
  if (typeInfo?.specialType?.defName) {
    const defType = fullType(typeInfo.specialType.defName) ?? 'Verse.Def';
    const opts = allDefsOfType(defType)
      .map((def) => def.defName)
      .concat(
        defs.filter((def) => def.type === defType).map((def) => def.defName)
      );
    return (
      <SimpleAutocomplete
        options={opts ?? []}
        path={path.concat(type)}
        value={field.get(type) as string}
      />
    );
  }
  if (typeInfo?.typeIdentifier === 'Verse.Rot4') {
    return (
      <SimpleAutocomplete
        options={['North', 'South', 'East', 'West']}
        path={path.concat(type)}
        value={field.get(type) as string}
      />
    );
  }

  return null;
}

SingleFieldInput.defaultProps = {
  type: 'value',
};

export const isSingleInput = (typeInfo: TypeInfo) =>
  typeInfo?.specialType?.string ||
  typeInfo?.specialType?.float ||
  typeInfo?.specialType?.integer ||
  (typeInfo?.specialType?.customFormats &&
    typeInfo.specialType?.customFormats.length) ||
  typeInfo?.specialType?.enum ||
  typeInfo?.specialType?.bool ||
  typeInfo?.typeIdentifier === 'System.Type' ||
  typeInfo?.specialType?.defName ||
  typeInfo?.typeIdentifier === 'Verse.Rot4';

const Memoized = memo(
  SingleFieldInput,
  (prevState, nextState) =>
    List(prevState.path).equals(List(nextState.path)) &&
    prevState.field.get(prevState.type ?? 'value') ===
      nextState.field.get(nextState.type ?? 'value') &&
    prevState.typeInfo === nextState.typeInfo
);

export default Memoized;
