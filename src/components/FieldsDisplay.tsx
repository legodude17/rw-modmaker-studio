import { Divider, IconButton, ListItem } from '@material-ui/core';
import { Seq, List } from 'immutable';
import { Add } from '@material-ui/icons';
import { ReactNode, useContext } from 'react';
import { Field, makeField } from '../Project';
// eslint-disable-next-line import/no-cycle
import DefFieldDisplay from './DefFieldDisplay';
// No way to avoid a cycle here, since these two components recusivly including each other is how it can display deeply nested props easily
import FieldDisplay from './FieldDisplay';
import { DataContext, DispatchContext, isSingleInput } from '../util';
import { TypeInfo } from '../completionItem';

function FieldsDisplay({
  fields,
  typeInfo,
  path,
  children,
}: {
  fields: List<Field>;
  typeInfo: TypeInfo;
  path: string[];
  children?: ReactNode;
}) {
  const dispatch = useContext(DispatchContext);
  const Data = useContext(DataContext);
  if (!Data) return null;
  let temp;
  return (
    <>
      {children}
      {fields.map((field, i) =>
        field.key === 'defName' ? null : (
          <ListItem key={field.id}>
            <DefFieldDisplay path={path.concat(i.toString())} field={field} />
          </ListItem>
        )
      )}
      <Divider variant="fullWidth" key=".divider" />
      {Seq(typeInfo?.childNodes ?? {})
        .filter((_, key) => !fields.filter((field) => field.key === key).size)
        .map((type, key) => (
          <ListItem key={key}>
            <FieldDisplay fieldName={key}>
              <IconButton
                onClick={() =>
                  dispatch({
                    type: 'add',
                    path,
                    newValue: makeField({
                      key,
                      type,
                      value:
                        (temp = Data.typeByName(type)) && isSingleInput(temp)
                          ? ''
                          : List(),
                      id: Math.random() * 10 ** Math.round(Math.random() * 10),
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
    </>
  );
}

FieldsDisplay.defaultProps = {
  children: [],
};

export default FieldsDisplay;
