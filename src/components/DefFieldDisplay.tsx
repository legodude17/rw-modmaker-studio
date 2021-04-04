import { useContext, memo } from 'react';
import { List } from 'immutable';
import { IconButton } from '@material-ui/core';
import { Remove } from '@material-ui/icons';
import { Field, makeField } from '../Project';
import FieldDisplay from './FieldDisplay';
import SingleFieldInput, { isSingleInput } from './SingleFieldInput';
import * as Data from '../DataManager';
import { DispatchContext } from '../misc';
import AddInnerField from './AddInnerField';

function DefFieldDisplay({
  path,
  field,
  typePath,
}: {
  path: string[];
  field: Field;
  typePath: string;
}) {
  const typeInfo = Data.typeByName(field.type);
  const dispatch = useContext(DispatchContext);
  if (typeInfo === undefined) return null;
  if (isSingleInput(typeInfo))
    return (
      <FieldDisplay fieldName={field.key}>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'row' }}>
          <SingleFieldInput
            field={field}
            path={path}
            typeInfo={typeInfo}
            typePath={typePath}
          />
          <IconButton
            onClick={() =>
              dispatch({
                path: path.slice(0, -1),
                type: 'remove',
                newValue: field,
              })
            }
            style={{ marginLeft: 10 }}
          >
            <Remove />
          </IconButton>
        </div>
      </FieldDisplay>
    );

  if (typeInfo.specialType?.enumerable?.genericType) {
    const innerTypeInfo = Data.typeByName(
      typeInfo.specialType.enumerable.genericType
    );
    if (innerTypeInfo === undefined) return null;
    const list = field.value as List<Field>;
    if (isSingleInput(innerTypeInfo)) {
      return (
        <FieldDisplay
          fieldName={field.key}
          actions={
            <AddInnerField
              typePath={`${typePath}!li`}
              typeInfo={innerTypeInfo}
              add={(value) =>
                dispatch({
                  type: 'add',
                  path: path.concat('value'),
                  newValue: makeField({
                    key: 'li',
                    value,
                    type: innerTypeInfo.typeIdentifier,
                  }),
                })
              }
            />
          }
          summary={
            <IconButton
              onClick={() =>
                dispatch({
                  path: path.slice(0, -1),
                  type: 'remove',
                  newValue: field,
                })
              }
              style={{ marginLeft: 20, marginRight: 20 }}
            >
              <Remove />
            </IconButton>
          }
        >
          {list.map((innerField, index) => (
            <div
              style={{ width: '90%', display: 'flex', flexDirection: 'row' }}
              key={innerField.key}
            >
              <SingleFieldInput
                field={innerField}
                path={path.concat(['value', index.toString()])}
                typeInfo={innerTypeInfo}
                typePath={`${typePath}!${innerField.key}`}
              />
            </div>
          ))}
        </FieldDisplay>
      );
    }

    console.log(
      'Found unhandled list:',
      field.type,
      innerTypeInfo.typeIdentifier
    );
    return null;
  }

  console.log(
    'Found unhandled type:',
    field.type,
    'value is',
    (field.value as List<Field>).toJS()
  );

  return null;
}

export default memo(DefFieldDisplay);
// export default DefFieldDisplay;
