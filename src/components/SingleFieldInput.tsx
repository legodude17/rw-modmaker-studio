import { useContext, memo } from 'react';
import { List } from 'immutable';
import { IMaskInput } from 'react-imask';
import { Field } from '../Project';
import SimpleText from './SimpleText';
import { TypeInfo } from '../completionItem';
import { DataContext, DefsContext } from '../util';
import PathedCheckbox from './PathedCheckbox';
import SimpleAutocomplete from './SimpleAutocomplete';
import { fullType } from '../DataManager';

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
  const Data = useContext(DataContext);
  const { defs } = useContext(DefsContext);
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
        textFieldProps={{ style: { flexGrow: 1 } }}
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
  if (!Data) return null;
  if (typeInfo.typeIdentifier === 'System.Type') {
    const parentTypeName = Data.data.parents[typePath];
    const parentTypeInfo = Data.typeByName(parentTypeName);
    if (!parentTypeInfo) return null;
    const opts = Data.allChildren(parentTypeInfo)?.map((t) =>
      t.typeIdentifier.replace('RimWorld.', '').replace('Verse.', '')
    );
    return (
      <SimpleAutocomplete
        options={opts ?? []}
        path={path.concat(type)}
        value={field.get(type) as string}
        textFieldProps={{ style: { flexGrow: 1 }, fullWidth: true }}
      />
    );
  }
  if (typeInfo?.specialType?.defName) {
    const defType =
      fullType(typeInfo.specialType.defName, undefined, Data) ?? 'Verse.Def';
    const opts = Data.allDefsOfType(defType)
      .filter((def) => !def.abstract)
      .map((def) => def.defName)
      .concat(
        defs
          .filter((def) => def.type === defType && !def.abstract)
          .map((def) => def.defName)
      );
    return (
      <SimpleAutocomplete
        options={opts ?? []}
        path={path.concat(type)}
        value={field.get(type) as string}
        textFieldProps={{ style: { flexGrow: 1 }, fullWidth: true }}
      />
    );
  }
  if (typeInfo?.typeIdentifier === 'Verse.Rot4') {
    return (
      <SimpleAutocomplete
        options={['North', 'South', 'East', 'West']}
        path={path.concat(type)}
        value={field.get(type) as string}
        textFieldProps={{ style: { flexGrow: 1 }, fullWidth: true }}
      />
    );
  }

  return null;
}

SingleFieldInput.defaultProps = {
  type: 'value',
};

const Memoized = memo(
  SingleFieldInput,
  (prevState, nextState) =>
    List(prevState.path).equals(List(nextState.path)) &&
    prevState.field.get(prevState.type ?? 'value') ===
      nextState.field.get(nextState.type ?? 'value') &&
    prevState.typeInfo === nextState.typeInfo
);

export default Memoized;
