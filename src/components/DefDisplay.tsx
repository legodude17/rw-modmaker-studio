import { useContext, memo } from 'react';
import { List as ListElement, ListItem, Paper } from '@material-ui/core';
import { Def } from '../Project';
import FieldDisplay from './FieldDisplay';
import { DataContext } from '../util';
import MetaDefFields from './MetaDefFields';
import FieldsDisplay from './FieldsDisplay';

// eslint-disable-next-line react/require-default-props
function DefDisplay({ def, defIndex }: { def?: Def; defIndex: number }) {
  const Data = useContext(DataContext);
  if (!def) return null;
  const defTypeInfo = Data?.typeByName(def.type);
  if (!defTypeInfo) return null;
  return (
    <Paper elevation={2}>
      <ListElement>
        <ListItem key=".meta">
          <FieldDisplay fieldName="Meta Info" expandable>
            <MetaDefFields def={def} path={['defs', defIndex.toString()]} />
          </FieldDisplay>
        </ListItem>
        <FieldsDisplay
          fields={def.fields}
          typeInfo={defTypeInfo}
          path={['defs', defIndex.toString(), 'fields']}
          typePath={def.type}
        />
      </ListElement>
    </Paper>
  );
}

export default memo(
  DefDisplay,
  (prevState, nextState) =>
    prevState.defIndex === nextState.defIndex &&
    (prevState.def?.equals(nextState.def) ?? false)
);
