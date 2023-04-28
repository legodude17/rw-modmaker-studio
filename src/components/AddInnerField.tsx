import * as React from 'react';
import { IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { TypeInfo } from '../completionItem';
import { DispatchContext } from '../util';
import SingleFieldInput from './SingleFieldInput';
import { makeField, ProjectAction } from '../Project';

export default function AddInnerField({
  add,
  typeInfo,
}: {
  add: (value: string) => void;
  typeInfo: TypeInfo;
}) {
  const [text, setText] = React.useState('');
  const dispatch: React.Dispatch<ProjectAction> = (value: ProjectAction) =>
    setText(value.newValue as string);
  return (
    <>
      <DispatchContext.Provider value={dispatch}>
        <SingleFieldInput
          typeInfo={typeInfo}
          path={[(!!text).toString()]}
          field={makeField({ value: text })}
        />
      </DispatchContext.Provider>
      <IconButton
        onClick={() => {
          add(text);
          setText('');
        }}
        key="add"
        disabled={!text}
        style={{ padding: 5 }}
      >
        <AddIcon />
      </IconButton>
    </>
  );
}
