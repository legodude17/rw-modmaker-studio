import * as React from 'react';
import {
  Toolbar,
  Drawer,
  List as ListElement,
  ListItem,
  ListItemText,
  makeStyles,
} from '@material-ui/core';
import { ClassNameMap } from '@material-ui/styles';
import { Map } from 'immutable';
import { Project } from '../Project';
import DefTypeList from './DefTypeList';
import { getId, getName } from '../util';

const useStyles = makeStyles((theme) => ({
  listItem: {
    margin: 0,
    padding: 5,
    display: 'block',
    position: 'relative',
    minWidth: 10,
    marginBottom: 5,
  },
  drawerContainer: {
    overflow: 'auto',
    overflowX: 'hidden',
  },
  drawerPaper2: {
    zIndex: theme.zIndex.drawer - 1,
    left: 'auto',
    position: 'fixed',
  },
}));

function CodeTabInt({
  project,
  setCurrent,
  paperRef,
  margin,
  update,
}: {
  project: Project;
  setCurrent: (arg: string) => void;
  paperRef: React.Ref<Node>;
  margin: number;
  update: () => void;
}) {
  const classes = useStyles();
  const defsByType = React.useMemo(
    () =>
      Map<string, string[]>().withMutations((map) =>
        project.defs.forEach((def) =>
          map.has(def.type)
            ? map.get(def.type)?.push(getName(def))
            : map.set(def.type, [getName(def)])
        )
      ),
    [project.defs.map((def) => getId(def)).join(' ')]
  );

  return (
    <Drawer
      variant="permanent"
      classes={{
        paper: classes.drawerPaper2,
      }}
      PaperProps={{
        ref: paperRef,
        style: {
          marginLeft: margin,
        },
      }}
    >
      <Toolbar />
      <div className={classes.drawerContainer}>
        <ListElement subheader={<li />}>
          <ListItem
            button
            key="manifest"
            onClick={() => setCurrent('.manifest')}
          >
            <ListItemText className={classes.listItem}>Manifest</ListItemText>
          </ListItem>
          {defsByType
            .map((defs, type) => (
              <li key={type}>
                <ul style={{ padding: 0 }}>
                  <DefTypeList
                    defs={defs}
                    type={type}
                    setCurrent={setCurrent}
                    update={update}
                  />
                </ul>
              </li>
            ))
            .valueSeq()}
        </ListElement>
      </div>
    </Drawer>
  );
}

function SearchTabInt({
  paperRef,
  setCurrent,
  margin,
}: {
  setCurrent: (arg: string) => void;
  paperRef: React.Ref<Node>;
  margin: number;
}) {
  const classes = useStyles();
  return (
    <Drawer
      variant="permanent"
      classes={{
        paper: classes.drawerPaper2,
      }}
      PaperProps={{ ref: paperRef, style: { marginLeft: margin } }}
    >
      <Toolbar />
      <div className={classes.drawerContainer}>
        <ListElement>
          {['.manifest', 'Def1', 'Def2', 'Def3', 'Def4'].map((text) => (
            <ListItem button key={text} onClick={() => setCurrent(text)}>
              <ListItemText className={classes.listItem}>{text}</ListItemText>
            </ListItem>
          ))}
        </ListElement>
      </div>
    </Drawer>
  );
}

export const CodeTab = React.memo(
  CodeTabInt,
  (prevState, nextState) =>
    prevState.project.defs.map((def) => getId(def)).join(' ') ===
      nextState.project.defs.map((def) => getId(def)).join(' ') &&
    prevState.paperRef === nextState.paperRef &&
    prevState.margin === nextState.margin
);

export const SearchTab = React.memo(SearchTabInt);
