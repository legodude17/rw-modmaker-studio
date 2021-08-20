import { Divider, FormControlLabel } from '@material-ui/core';
import { relative, resolve } from 'path';
import { memo, useContext, useRef } from 'react';
import { Def, makeField } from '../Project';
import { DataContext, DispatchContext, DefsContext } from '../util';
import PathedCheckbox from './PathedCheckbox';
import SimpleAutocomplete from './SimpleAutocomplete';
import SimpleText from './SimpleText';

function MetaDefFields({ def, path }: { def: Def; path: string[] }) {
  const dispatch = useContext(DispatchContext);
  const Data = useContext(DataContext);
  const { defs, folder } = useContext(DefsContext);
  const defRef = useRef(def);
  defRef.current = def;
  return (
    <>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'row' }}>
        <SimpleText
          path={path.concat('defName')}
          label="Def Name"
          value={def.defName}
          style={{ width: '45%' }}
          textFieldProps={{
            onChange: (event) => {
              const defNameIdx = def.fields.findIndex(
                (field) => field.key === 'defName'
              );
              if (
                defNameIdx === -1 &&
                event.target.value &&
                event.target.value !== 'UnnamedDef'
              )
                dispatch({
                  type: 'add',
                  path: path.concat('fields'),
                  newValue: makeField({
                    key: 'defName',
                    type: 'System.String',
                    value: event.target.value,
                  }),
                });
              else if (defNameIdx > -1)
                dispatch({
                  type: 'set',
                  path: path.concat('fields', defNameIdx.toString(), 'value'),
                  newValue: event.target.value,
                });
              dispatch({
                type: 'set',
                path: ['current'],
                newValue: `${def.type}/${event.target.value}`,
              });
            },
          }}
        />
        <Divider
          orientation="vertical"
          flexItem
          style={{ margin: '0 15px 0 15px' }}
        />
        <SimpleAutocomplete
          options={
            (Data?.allDefsOfType(def.type).map((d) => d.name) ?? [])
              .concat(
                defs.filter((d) => d.type === def.type).map((d) => d.name)
              )
              .filter((s) => s) as string[]
          }
          textFieldProps={{ label: 'Parent' }}
          path={path.concat('parent')}
          value={def.parent ?? ''}
        />
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          marginBottom: 10,
        }}
      >
        <SimpleText
          path={path.concat('name')}
          label="Name (for Inheritance)"
          value={def.name ?? ''}
          style={{ width: '45%' }}
        />
        <Divider
          orientation="vertical"
          flexItem
          style={{ margin: '0 15px 0 15px' }}
        />
        <FormControlLabel
          label="Abstract"
          control={
            <PathedCheckbox
              path={path.concat('abstract')}
              startingValue={def.abstract}
            />
          }
        />
      </div>
      <SimpleAutocomplete
        path={path.concat('file')}
        textFieldProps={{ label: 'File Path', style: { width: '100%' } }}
        value={relative(folder, def.file)}
        transformValue={(arg) => resolve(folder, arg)}
        options={[...new Set(defs.map((d) => d.file))].map((f) =>
          relative(folder, f)
        )}
      />
    </>
  );
}

export default memo(MetaDefFields);
