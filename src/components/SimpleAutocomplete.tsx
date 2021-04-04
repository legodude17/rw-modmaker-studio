import { useContext, useState, useEffect, memo } from 'react';
import { TextField, TextFieldProps } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { DispatchContext } from '../misc';

function SimpleAutocomplete({
  options,
  path,
  value,
}: {
  options: string[];
  path: string[];
  value: string;
}) {
  const dispatch = useContext(DispatchContext);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [path.join('.')]);
  useEffect(() => {
    dispatch({
      type: 'set',
      path,
      newValue: text,
    });
  }, [text]);

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(a) => a}
      renderInput={(params: TextFieldProps) => (
        <TextField
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...params}
          variant="outlined"
        />
      )}
      inputValue={text}
      onInputChange={(_, newValue) => setText(newValue)}
      freeSolo
      selectOnFocus
      style={{ flexGrow: 1 }}
      filterOptions={(opts, state) =>
        state.inputValue === value
          ? opts
          : opts.filter((opt) =>
              opt.toLowerCase().includes(state.inputValue.toLowerCase())
            )
      }
    />
  );
}

export default memo(
  SimpleAutocomplete,
  (prevState, nextState) =>
    prevState.options.join('-') === nextState.options.join('-') &&
    prevState.path.join('.') === nextState.path.join('.')
);
