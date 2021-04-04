import React from 'react';
import { TextField, TextFieldProps } from '@material-ui/core';
import { DispatchContext } from '../misc';

function SimpleText({
  value = '',
  path,
  style,
  multiline,
  textFieldProps,
  label = () => '',
  error = () => false,
  helperText = () => '',
}: {
  path: string[];
  value?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
  textFieldProps?: TextFieldProps;
  label?: (text: string) => string;
  helperText?: (text: string) => string;
  error?: (text: string) => boolean;
}) {
  const dispatch = React.useContext(DispatchContext);
  const [text, setText] = React.useState(value);
  React.useEffect(() => setText(value), [path]);
  React.useEffect(() => {
    dispatch({
      type: 'set',
      path,
      newValue: text,
    });
  }, [text]);
  return (
    <TextField
      onChange={(event) => setText(event.target.value)}
      style={style}
      value={text}
      multiline={multiline}
      fullWidth
      key="input"
      label={label(text)}
      error={error(text)}
      helperText={helperText(text)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...textFieldProps}
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
};

export default React.memo(SimpleText);
