import { List } from 'immutable';
import { useState, useContext, memo } from 'react';
import { Checkbox } from '@material-ui/core';
import { DispatchContext } from '../util';

function PathedCheckbox({
  path,
  startingValue,
}: {
  path: string[];
  startingValue: boolean;
}) {
  const [checked, setChecked] = useState(startingValue);
  const dispatch = useContext(DispatchContext);
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

export default memo(PathedCheckbox, (prevState, nextState) =>
  List(prevState.path).equals(List(nextState.path))
);
