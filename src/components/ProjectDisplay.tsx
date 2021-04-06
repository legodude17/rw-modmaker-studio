import * as React from 'react';
import { CircularProgress, Toolbar, useTheme } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import settings from 'electron-settings';
import { promises as fs } from 'fs';
import path from 'path';
import MainAppToolbar from './MainAppToolbar';
import ManifestDisplay from './ManifestDisplay';
import Sidebar1 from './Sidebar1';
import { CodeTab, SearchTab } from './Sidebar2';
import { Project, makeDef } from '../Project';
import DefDisplay from './DefDisplay';
import { getId, SidebarTab, DispatchContext, DataContext } from '../util';
import { DefsContext } from './SingleFieldInput';
import { DataManager } from '../DataManagerType';
import { createManager } from '../DataManager';

function useWidth(deps: React.DependencyList): [number, React.Ref<Node>] {
  const [width, setWidth] = React.useState(0);

  const measureRef = React.useCallback((node) => {
    if (node !== null) {
      setWidth(node.getBoundingClientRect().width);
    }
  }, deps);

  return [width, measureRef];
}

function TabHelper({
  children,
  wantTab,
  curTab,
}: {
  wantTab: SidebarTab;
  curTab: SidebarTab;
  children: React.ReactNode;
}) {
  return <>{curTab === wantTab && children}</>;
}

function ProjectDisplay({
  classes,
  project,
}: {
  classes: ClassNameMap<
    | 'root'
    | 'content'
    | 'appBar'
    | 'drawer'
    | 'drawerPaper1'
    | 'drawerPaper2'
    | 'drawerContainer'
    | 'pathInput'
    | 'title'
    | 'container'
    | 'listItem'
    | 'modal'
  >;
  project: Project;
}) {
  const dispatch = React.useContext(DispatchContext);
  const [tab, setTab] = React.useState(SidebarTab.Code);
  const [current, setCurrent] = React.useState('.manifest');
  const [counter, setCounter] = React.useState(0);
  const update = React.useCallback(() => setCounter((num) => num + 1), []);
  const [small, sidebar1Ref] = useWidth([counter]);
  const [large, sidebar2Ref] = useWidth([project.defs, counter]);

  React.useEffect(() => {
    function addDef() {
      dispatch({
        type: 'add',
        path: ['defs'],
        newValue: makeDef(),
      });
    }
    ipcRenderer.on('new-def', addDef);
    return () => {
      ipcRenderer.off('new-def', addDef);
    };
  }, []);
  // React.useEffect(() => {
  //   Data.regenerate(project.manifest.deps, project.folder);
  // }, [project.manifest.deps, project.folder]);
  React.useEffect(() => {
    if (project.folder) settings.set('projectfolder', project.folder);
  }, [project.folder]);
  const usedTheme = useTheme();

  return (
    <div className={classes.root}>
      <MainAppToolbar classes={classes} />
      <Sidebar1 classes={classes} setTab={setTab} paperRef={sidebar1Ref} />
      <TabHelper curTab={tab} wantTab={SidebarTab.Code}>
        <CodeTab
          classes={classes}
          project={project}
          setCurrent={setCurrent}
          paperRef={sidebar2Ref}
          margin={small}
          update={update}
        />
      </TabHelper>
      <TabHelper curTab={tab} wantTab={SidebarTab.Search}>
        <SearchTab
          classes={classes}
          setCurrent={setCurrent}
          paperRef={sidebar2Ref}
          margin={small}
        />
      </TabHelper>
      <main
        className={classes.content}
        style={{
          marginLeft: small + large,
          transition: usedTheme.transitions.create('margin-left'),
        }}
      >
        <Toolbar />
        {current === '.manifest' ? (
          <ManifestDisplay manifest={project.manifest} />
        ) : (
          <DefsContext.Provider value={project.defs.toArray()}>
            <DefDisplay
              def={project.defs.find((def) => getId(def) === current)}
              defIndex={project.defs.findIndex((def) => getId(def) === current)}
            />
          </DefsContext.Provider>
        )}
      </main>
    </div>
  );
}

export default React.memo(
  ProjectDisplay,
  (prevState, nextState) =>
    prevState.project.folder === nextState.project.folder
);
