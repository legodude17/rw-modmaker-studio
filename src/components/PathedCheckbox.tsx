import { List } from 'immutable';
import React from 'react';
import { Checkbox } from '@material-ui/core';
import { DispatchContext } from '../misc';

function PathedCheckbox({
  path,
  startingValue,
}: {
  path: string[];
  startingValue: boolean;
}) {
  const [checked, setChecked] = React.useState(startingValue);
  const dispatch = React.useContext(DispatchContext);
  return (
    <Checkbox
      checked={checked}
      style={{ flexGrow: 1 }}
      onChange={(event) => {
        dispatch({
          type: 'set',
          path,
          newValue: event.target.checked ? 'true' : 'false',
        });
        setChecked(event.target.checked);
      }}
    />
  );
}

export default React.memo(PathedCheckbox, (prevState, nextState) =>
  List(prevState.path).equals(List(nextState.path))
);
