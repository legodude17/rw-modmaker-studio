import { useState, useContext } from 'react';
import { IconButton, TextField, TextFieldProps } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { Autocomplete } from '@material-ui/lab';
import * as Data from '../DataManager';
import { ModInfo } from '../completionItem';

export default function AddMod({
  add,
  prop,
}: {
  add: (mod: string) => void;
  prop: keyof ModInfo;
}) {
  const [addMod, setAddMod] = useState('');
  const data = useContext(Data.DataContext);
  return (
    <>
      <Autocomplete
        id="add-mod-autocomplete"
        options={data.mods.map((mod) => mod[prop])}
        getOptionLabel={(a) => a ?? ''}
        renderInput={(params: TextFieldProps) => (
          <TextField
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...params}
            label="Add Mod"
            variant="outlined"
          />
        )}
        freeSolo
        clearOnBlur={false}
        inputValue={addMod}
        onInputChange={(_event, newValue: string) => {
          setAddMod(newValue);
        }}
        style={{ width: '50%' }}
      />
      <IconButton
        onClick={() => {
          add(addMod);
          setAddMod('');
        }}
        key="add"
        disabled={!addMod}
        style={{ padding: 5 }}
      >
        <AddIcon />
      </IconButton>
    </>
  );
}
