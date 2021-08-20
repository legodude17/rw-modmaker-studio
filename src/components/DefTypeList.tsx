import { useState, memo } from 'react';
import {
  ListItem,
  ListItemText,
  ListSubheader,
  useTheme,
  Collapse,
} from '@material-ui/core';

function DefTypeList({
  defs,
  type,
  setCurrent,
  update,
}: {
  defs: string[];
  type: string;
  setCurrent: (arg: string) => void;
  update: () => void;
}) {
  const [collapsed, setCollased] = useState(false);
  const theme = useTheme();

  return (
    <>
      <ListSubheader>
        <ListItem
          style={{
            padding: 0,
            margin: 0,
            backgroundColor: theme.palette.background.paper,
          }}
          button
          onClick={() => {
            setCollased((val) => !val);
          }}
        >
          <ListItemText>{type}</ListItemText>
        </ListItem>
      </ListSubheader>
      <Collapse
        in={!collapsed}
        timeout="auto"
        unmountOnExit
        onEnter={update}
        onExited={update}
      >
        {defs.map((def) => (
          <ListItem
            button
            onClick={() => {
              setCurrent(`${type}/${def}`);
              update();
            }}
            key={def}
            style={{ fontSize: 5, marginLeft: 15 }}
          >
            <ListItemText
              primaryTypographyProps={{
                style: { fontSize: '0.85rem' },
              }}
            >
              {def}
            </ListItemText>
          </ListItem>
        ))}
      </Collapse>
    </>
  );
}

export default memo(
  DefTypeList,
  (prevState, nextState) =>
    prevState.type === nextState.type &&
    prevState.defs.join(' ') === nextState.defs.join(' ')
);
