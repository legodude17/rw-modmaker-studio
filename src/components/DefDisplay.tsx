import { useContext, memo } from 'react';
import {
  IconButton,
  List as ListElement,
  ListItem,
  Paper,
} from '@material-ui/core';
import { Seq, List } from 'immutable';
import { Add } from '@material-ui/icons';
import { Def, makeField } from '../Project';
import DefFieldDisplay from './DefFieldDisplay';
import FieldDisplay from './FieldDisplay';
import { DataContext, DispatchContext } from '../util';
import { isSingleInput } from './SingleFieldInput';

// eslint-disable-next-line react/require-default-props
function DefDisplay({ def, defIndex }: { def?: Def; defIndex: number }) {
  const dispatch = useContext(DispatchContext);
  const Data = useContext(DataContext);
  if (!def || !Data) return null;
  const defTypeInfo = Data.typeByName(def.type);
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
            (_, key) => !def.fields.filter((field) => field.key === key).size
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
                          (temp = Data.typeByName(type)) && isSingleInput(temp)
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

export default memo(
  DefDisplay,
  (prevState, nextState) =>
    prevState.defIndex === nextState.defIndex &&
    (prevState.def?.equals(nextState.def) ?? false)
);
