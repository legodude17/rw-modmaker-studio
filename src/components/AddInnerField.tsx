import * as React from 'react';
import { IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import * as Data from '../DataManager';
import { TypeInfo } from '../completionItem';
import { DispatchContext } from '../misc';
import SingleFieldInput from './SingleFieldInput';
import { makeField, ProjectAction } from '../Project';

export default function AddInnerField({
  add,
  typePath,
  typeInfo,
}: {
  add: (value: string) => void;
  typePath: string;
  typeInfo: TypeInfo;
}) {
  const [text, setText] = React.useState('');
  const data = React.useContext(Data.DataContext);
  const dispatch: React.Dispatch<ProjectAction> = (value: ProjectAction) =>
    setText(value.newValue as string);
  return (
    <>
      <DispatchContext.Provider value={dispatch}>
        <SingleFieldInput
          typePath={typePath}
          typeInfo={typeInfo}
          path={[!!text]}
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
