import { useContext, memo } from 'react';
import { List, Map } from 'immutable';
import {
  Divider,
  IconButton,
  List as ListElement,
  Paper,
  ListItem,
} from '@material-ui/core';
import { Remove, Add as AddIcon } from '@material-ui/icons';
import { Field, makeField } from '../Project';
import FieldDisplay from './FieldDisplay';
import SingleFieldInput from './SingleFieldInput';
import { DataContext, DispatchContext, isSingleInput } from '../util';
import AddInnerField from './AddInnerField';
// No way to avoid a cycle here, since these two components recusivly including each other is how it can display deeply nested props easily
// eslint-disable-next-line import/no-cycle
import FieldsDisplay from './FieldsDisplay';
import Add from './Add';
import SimpleAutocomplete from './SimpleAutocomplete';
import { fullType } from '../DataManager';
import log from '../log';

function DefFieldDisplay({ path, field }: { path: string[]; field: Field }) {
  const Data = useContext(DataContext);
  const dispatch = useContext(DispatchContext);
  if (!Data) return null;
  const typeInfo = Data.typeByName(field.type);
  if (typeInfo === undefined) return null;
  if (isSingleInput(typeInfo))
    return (
      <FieldDisplay fieldName={field.key}>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'row' }}>
          <SingleFieldInput field={field} path={path} typeInfo={typeInfo} />
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
          expandable
          fieldName={field.key}
          actions={
            <AddInnerField
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
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                marginBottom: 10,
              }}
              key={innerField.id}
            >
              <SingleFieldInput
                field={innerField}
                path={path.concat(['value', index.toString()])}
                typeInfo={innerTypeInfo}
              />
              <IconButton
                onClick={() =>
                  dispatch({
                    path: path.concat(['value']),
                    type: 'remove',
                    newValue: innerField,
                  })
                }
                style={{ marginLeft: 20, marginRight: 20 }}
              >
                <Remove />
              </IconButton>
            </div>
          ))}
        </FieldDisplay>
      );
    }

    if (innerTypeInfo?.specialType?.customXml) {
      const keyTypeInfo = Data.typeByName(
        innerTypeInfo.specialType.customXml.key
      );
      const valueTypeInfo = Data.typeByName(
        innerTypeInfo.specialType.customXml.value
      );
      if (!(keyTypeInfo && valueTypeInfo)) return null;
      return (
        <FieldDisplay
          expandable
          fieldName={field.key}
          actions={
            <AddInnerField
              typeInfo={keyTypeInfo}
              add={(value) =>
                dispatch({
                  type: 'add',
                  path: path.concat('value'),
                  newValue: makeField({
                    key: value,
                    value: '',
                    type: keyTypeInfo.typeIdentifier,
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
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                marginBottom: 10,
              }}
              key={innerField.id}
            >
              <SingleFieldInput
                field={innerField}
                type="key"
                path={path.concat(['value', index.toString()])}
                typeInfo={keyTypeInfo}
              />
              <Divider
                orientation="vertical"
                flexItem
                style={{ margin: '0 15px 0 15px' }}
              />
              <SingleFieldInput
                field={innerField}
                path={path.concat(['value', index.toString()])}
                typeInfo={valueTypeInfo}
              />
              <IconButton
                onClick={() =>
                  dispatch({
                    path: path.concat(['value']),
                    type: 'remove',
                    newValue: innerField,
                  })
                }
                style={{ marginLeft: 20, marginRight: 20 }}
              >
                <Remove />
              </IconButton>
            </div>
          ))}
        </FieldDisplay>
      );
    }

    if (Data.allChildren(innerTypeInfo)?.length) {
      return (
        <FieldDisplay
          expandable
          fieldName={field.key}
          actions={
            <Add
              add={(value) =>
                dispatch({
                  type: 'add',
                  path: path.concat('value'),
                  newValue: makeField({
                    key: 'li',
                    value: List(),
                    type: fullType(value, undefined, Data),
                    attrs: Map({ Class: value }),
                  }),
                })
              }
              opts={
                Data.allChildren(innerTypeInfo)?.map((ti) =>
                  ti.typeIdentifier
                    .replace('Verse.', '')
                    .replace('RimWorld.', '')
                ) ?? ['']
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
            <Paper key={innerField.id} style={{ marginBottom: 25 }}>
              <ListElement>
                <FieldsDisplay
                  fields={innerField.value as List<Field>}
                  typeInfo={Data.typeByName(innerField.type) ?? innerTypeInfo}
                  path={path.concat('value', index.toString(), 'value')}
                >
                  <ListItem key=".Class">
                    <FieldDisplay fieldName="Class">
                      <SimpleAutocomplete
                        path={path.concat(
                          'value',
                          index.toString(),
                          'attrs',
                          'Class'
                        )}
                        value={innerField.attrs?.get('Class') ?? ''}
                        options={
                          Data.allChildren(innerTypeInfo)?.map((ti) =>
                            ti.typeIdentifier
                              .replace('Verse.', '')
                              .replace('RimWorld.', '')
                          ) ?? ['']
                        }
                        onBlur={(text) =>
                          dispatch({
                            type: 'set',
                            path: path.concat(
                              'value',
                              index.toString(),
                              'type'
                            ),
                            newValue: fullType(text, undefined, Data) ?? '',
                          })
                        }
                      />
                      <IconButton
                        onClick={() =>
                          dispatch({
                            path: path.concat('value', index.toString()),
                            type: 'remove',
                            newValue: field,
                          })
                        }
                        style={{ marginLeft: 20, marginRight: 20 }}
                      >
                        <Remove />
                      </IconButton>
                    </FieldDisplay>
                  </ListItem>
                </FieldsDisplay>
              </ListElement>
            </Paper>
          ))}
        </FieldDisplay>
      );
    }

    return (
      <FieldDisplay
        expandable
        fieldName={field.key}
        actions={
          <IconButton
            onClick={() => {
              dispatch({
                type: 'add',
                path,
                newValue: makeField({
                  key: 'li',
                  type: innerTypeInfo.typeIdentifier,
                  value: List(),
                }),
              });
            }}
            key="add"
            style={{ padding: 5 }}
          >
            <AddIcon />
          </IconButton>
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
          <Paper key={innerField.id}>
            <FieldsDisplay
              fields={innerField.value as List<Field>}
              typeInfo={innerTypeInfo}
              path={path.concat('value', index.toString(), 'value')}
            />
          </Paper>
        ))}
      </FieldDisplay>
    );
  }

  if (typeInfo.childNodes && typeof field.value !== 'string') {
    return (
      <FieldDisplay
        expandable
        fieldName={field.key}
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
        <ListElement>
          <FieldsDisplay
            typeInfo={typeInfo}
            path={path.concat('value')}
            fields={field.value as List<Field>}
          />
        </ListElement>
      </FieldDisplay>
    );
  }

  /* eslint-disable no-console */

  log.warn(
    'Found unhandled type:',
    field.type,
    'value is',
    typeof field.value === 'string'
      ? field.value
      : (field.value as List<Field>).toJS()
  );

  return null;
}

export default memo(
  DefFieldDisplay,
  (prevState, nextState) =>
    prevState.path.join('.') === nextState.path.join('.') &&
    (prevState.field?.equals?.(nextState.field) ??
      prevState.field === nextState.field)
);
