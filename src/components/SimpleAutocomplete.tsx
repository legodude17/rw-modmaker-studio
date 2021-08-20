import { useContext, useState, useEffect, memo } from 'react';
import { TextField, TextFieldProps } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { DispatchContext } from '../util';

function SimpleAutocomplete({
  options,
  path,
  value,
  textFieldProps,
  onBlur = () => undefined,
  transformValue = (arg) => arg,
}: {
  options: string[];
  path: string[];
  value: string;
  textFieldProps?: TextFieldProps;
  transformValue?: (arg: string) => string;
  onBlur?: (val: string) => void;
}) {
  const dispatch = useContext(DispatchContext);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [path.join('.')]);
  useEffect(() => {
    if (text !== value)
      dispatch({
        type: 'set',
        path,
        newValue: transformValue(text),
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
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...textFieldProps}
          variant="outlined"
          onBlur={(event) => {
            onBlur(text);
            textFieldProps?.onBlur?.(event);
          }}
        />
      )}
      inputValue={text}
      onInputChange={(_, newValue) => setText(newValue)}
      onChange={(_, newValue) => setText(newValue ?? '')}
      freeSolo
      selectOnFocus
      style={{ flexGrow: 1, width: '100%' }}
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

SimpleAutocomplete.defaultProps = {
  textFieldProps: {},
  onBlur: () => undefined,
  transformValue: (arg: string) => arg,
};

export default memo(
  SimpleAutocomplete,
  (prevState, nextState) =>
    prevState.options.join('-') === nextState.options.join('-') &&
    prevState.path.join('.') === nextState.path.join('.')
);
