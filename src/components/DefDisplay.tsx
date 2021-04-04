import React from 'react';
import {
  IconButton,
  List as ListElement,
  ListItem,
  Paper,
} from '@material-ui/core';
import { Seq, List } from 'immutable';
import { Add } from '@material-ui/icons';
import { Def, makeField } from '../Project';
import { getId } from '../util';
import DefFieldDisplay from './DefFieldDisplay';
import { typeByName } from '../DataManager';
import FieldDisplay from './FieldDisplay';
import { DispatchContext } from '../misc';
import { isSingleInput } from './SingleFieldInput';

function DefDisplay({ def, defIndex }: { def: Def; defIndex: number }) {
  const dispatch = React.useContext(DispatchContext);
  if (!def) return null;
  const defTypeInfo = typeByName(def.type);
  let temp;
  console.log('defTypeInfo:', defTypeInfo?.childNodes);
  return (
    <Paper elevation={2}>
      <ListElement>
        {def.fields.map((field, i) => (
          <ListItem key={field.key}>
            <DefFieldDisplay
              path={['defs', defIndex.toString(), 'fields', i.toString()]}
              field={field}
              typePath={`${def.type}!${field.key}`}
            />
          </ListItem>
        ))}
        {Seq(defTypeInfo?.childNodes ?? {})
          .filter(
            (type, key) => !def.fields.filter((field) => field.key === key).size
          )
          .map((type, key) => (
            <ListItem key={key}>
              <FieldDisplay fieldName={key}>
                <IconButton
                  onClick={() =>
                    dispatch({
                      type: 'add',
                      path: ['defs', defIndex.toString(), 'fields'],
                      newValue: makeField({
                        key,
                        type,
                        value:
                          (temp = typeByName(type)) && isSingleInput(temp)
                            ? ''
                            : List(),
                      }),
                    })
                  }
                >
                  <Add />
                </IconButton>
              </FieldDisplay>
            </ListItem>
          ))
          .valueSeq()}
      </ListElement>
    </Paper>
  );
}

export default React.memo(
  DefDisplay,
  (prevState, nextState) =>
    prevState.defIndex === nextState.defIndex &&
    getId(prevState.def) === getId(nextState.def) &&
    prevState.def.fields.size === nextState.def.fields.size
);
