import React from 'react';
import {
  Toolbar,
  Drawer,
  List as ListElement,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { ClassNameMap } from '@material-ui/styles';
import { Map } from 'immutable';
import { Project } from '../Project';
import DefTypeList from './DefTypeList';
import { getName } from '../util';

function CodeTabInt({
  classes,
  project,
  setCurrent,
  paperRef,
  margin,
  update,
}: {
  classes: ClassNameMap<
    'drawerPaper2' | 'drawerContainer' | 'listItem' | 'drawer'
  >;
  project: Project;
  setCurrent: (arg: string) => void;
  paperRef: React.Ref<Node>;
  margin: number;
  update: () => void;
}) {
  const defsByType = React.useMemo(
    () =>
      Map<string, string[]>().withMutations((map) =>
        project.defs.forEach((def) =>
          map.has(def.type)
            ? map.get(def.type)?.push(getName(def))
            : map.set(def.type, [getName(def)])
        )
      ),
    [project.defs]
  );
  return (
    <Drawer
      className={classes.drawer}
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
              <li key={type} style={{}}>
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
  classes,
  paperRef,
  setCurrent,
  margin,
}: {
  classes: ClassNameMap<
    'drawerPaper2' | 'drawerContainer' | 'listItem' | 'drawer'
  >;
  setCurrent: (arg: string) => void;
  paperRef: React.Ref<Node>;
  margin: number;
}) {
  return (
    <Drawer
      className={classes.drawer}
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

export const CodeTab = React.memo(CodeTabInt);
// (prevState, nextState) =>
//   prevState.project.defs
//     .map((def) => `${def.type}/${def.defName}`)
//     .equals(
//       nextState.project.defs.map((def) => `${def.type}/${def.defName}`)
//     ) && prevState.paperRef === nextState.paperRef

export const SearchTab = React.memo(SearchTabInt);
