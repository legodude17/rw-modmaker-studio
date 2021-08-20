import { useState } from 'react';
import { IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { DispatchContext } from '../util';
import SimpleAutocomplete from './SimpleAutocomplete';
import { ProjectAction } from '../Project';

export default function Add({
  add,
  opts,
}: {
  add: (mod: string) => void;
  opts: string[];
}) {
  const [text, setText] = useState('');
  const dispatch: React.Dispatch<ProjectAction> = (value: ProjectAction) =>
    setText(value.newValue as string);
  return (
    <>
      <DispatchContext.Provider value={dispatch}>
        <SimpleAutocomplete
          options={opts}
          textFieldProps={{
            label: 'Add',
            style: { width: '50%' },
            fullWidth: true,
          }}
          value={text}
          path={[(!!text).toString()]}
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
