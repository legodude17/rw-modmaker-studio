import * as React from 'react';
import { TextField, TextFieldProps } from '@material-ui/core';
import { DispatchContext } from '../util';

function SimpleText({
  value = '',
  path,
  style,
  multiline,
  textFieldProps,
  label = () => '',
  error = () => false,
  helperText = () => '',
  transformValue = (arg) => arg,
}: {
  path: string[];
  value?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
  textFieldProps?: TextFieldProps;
  label?: ((text: string) => string) | string;
  helperText?: ((text: string) => string) | string;
  error?: ((text: string) => boolean) | boolean;
  transformValue?: (arg: string) => string;
}) {
  const dispatch = React.useContext(DispatchContext);
  const [text, setText] = React.useState(value);
  React.useEffect(() => setText(value), [path]);

  return (
    <TextField
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...textFieldProps}
      onChange={(event) => {
        dispatch({
          type: 'set',
          path,
          newValue: transformValue(event.target.value),
        });
        textFieldProps?.onChange?.(event);
        setText(event.target.value);
      }}
      style={style}
      value={text}
      multiline={multiline}
      fullWidth
      key="input"
      label={typeof label === 'function' ? label(text) : label}
      error={typeof error === 'function' ? error(text) : error}
      helperText={
        typeof helperText === 'function' ? helperText(text) : helperText
      }
    />
  );
}

SimpleText.defaultProps = {
  multiline: false,
  style: {},
  textFieldProps: {},
  label: () => '',
  helperText: () => '',
  error: () => false,
  value: '',
  transformValue: (arg: string) => arg,
};

export default React.memo(
  SimpleText,
  (prevState, nextState) =>
    prevState.path.join('.') === nextState.path.join('.')
);
