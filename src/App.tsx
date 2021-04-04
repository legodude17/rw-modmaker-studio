import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import {
  CssBaseline,
  ThemeProvider,
  Toolbar,
  useTheme,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import { List } from 'immutable';
import path from 'path';
import settings from 'electron-settings';
import { promises as fs } from 'fs';
import makeStyles from './styles';
import Settings from './Settings';
import theme from './theme';
import MainAppToolbar from './components/MainAppToolbar';
import ManifestDisplay from './components/ManifestDisplay';
import Sidebar1 from './components/Sidebar1';
import { CodeTab, SearchTab } from './components/Sidebar2';
import TextModal from './components/TextModal';
import { SidebarTab, DispatchContext } from './misc';
import {
  makeProject,
  Project,
  ProjectAction,
  NewValue,
  makeDef,
} from './Project';
import * as Data from './DataManager';
import { readProject } from './fileLoadSaver';
import DefDisplay from './components/DefDisplay';
import { getId } from './util';
import { DefsContext } from './components/SingleFieldInput';

function projectReducer(prevState: Project, action: ProjectAction): Project {
  console.log(action.path, action.newValue, action.type);
  switch (action.type) {
    case 'set':
      return prevState.setIn(action.path, action.newValue);
    case 'switch':
      return action.newValue as Project;
    case 'add':
      return prevState.setIn(
        action.path,
        (prevState.getIn(action.path) as List<NewValue>).push(action.newValue)
      );
    case 'remove': {
      const val = prevState.getIn(action.path);
      if (List.isList(val)) {
        const list = val as List<NewValue>;
        return prevState.setIn(
          action.path,
          list.remove(list.indexOf(action.newValue))
        );
      }
      return prevState.removeIn(action.path);
    }
    default:
      return prevState;
  }
}

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

export function Home({
  classes,
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
}) {
  const [tab, setTab] = React.useState(SidebarTab.Code);
  const [current, setCurrent] = React.useState('.manifest');
  const [project, dispatch] = React.useReducer<
    React.Reducer<Project, ProjectAction>,
    undefined
  >(projectReducer, undefined, makeProject);
  const openNewProjectDialog = React.useRef(() => null);
  const openOpenProjectDialog = React.useRef(() => null);
  const [counter, setCounter] = React.useState(0);
  const update = React.useCallback(() => setCounter((num) => num + 1), []);
  const [small, sidebar1Ref] = useWidth([counter]);
  const [large, sidebar2Ref] = useWidth([project.defs, counter]);
  React.useEffect(() => {
    const newProjectHook = () => openNewProjectDialog.current();
    const openProjectHook = () => openOpenProjectDialog.current();
    function addDef() {
      dispatch({
        type: 'add',
        path: ['defs'],
        newValue: makeDef(),
      });
    }
    ipcRenderer.on('new-project', newProjectHook);
    ipcRenderer.on('new-def', addDef);
    ipcRenderer.on('open-project', openProjectHook);
    return () => {
      ipcRenderer.off('new-project', newProjectHook);
      ipcRenderer.off('new-def', addDef);
      ipcRenderer.off('open-project', openProjectHook);
    };
  }, []);
  // React.useEffect(() => {
  //   Data.regenerate(project.manifest.deps, project.folder);
  // }, [project.manifest.deps, project.folder]);
  React.useEffect(() => {
    if (project.folder) settings.set('projectfolder', project.folder);
    else
      settings
        .get('projectfolder')
        .then((folder) => readProject(folder as string))
        .then((newProject) =>
          dispatch({
            type: 'switch',
            path: ['.'],
            newValue: newProject,
          })
        )
        .catch(console.error);
  }, [project.folder]);
  const usedTheme = useTheme();

  return (
    <DispatchContext.Provider value={dispatch}>
      <Data.User>
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
                  defIndex={project.defs.findIndex(
                    (def) => getId(def) === current
                  )}
                />
              </DefsContext.Provider>
            )}
          </main>

          <TextModal
            openRef={openNewProjectDialog}
            onSubmit={(name) =>
              settings
                .get('rwlocalmods')
                .then((s) => path.join(s as string, name))
                .then((folder) =>
                  dispatch({
                    type: 'switch',
                    path: ['.'],
                    newValue: makeProject({ folder }),
                  })
                )
                .catch(console.error)
            }
            classes={classes}
            label="New Project"
            helperText="The name of the folder to create in your mod folder"
            buttonText="Create!"
          />

          <TextModal
            openRef={openOpenProjectDialog}
            onSubmit={(name) =>
              settings
                .get('rwlocalmods')
                .then((s) => path.join(s as string, name))
                .then(readProject)
                .then((newProject) =>
                  dispatch({
                    type: 'switch',
                    path: ['.'],
                    newValue: newProject,
                  })
                )
                .catch(console.error)
            }
            classes={classes}
            label="Open Project"
            helperText="The name of the folder to open"
            buttonText="Open"
            autocomplete={() =>
              settings
                .get('rwlocalmods')
                .then((loc) => fs.readdir(loc as string))
            }
          />
        </div>
      </Data.User>
    </DispatchContext.Provider>
  );
}
const useStyles = makeStyles();

export default function App() {
  const classes = useStyles();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Switch>
          <Route path="/settings">
            <Settings classes={classes} />
          </Route>
          <Route path="/">
            <Home classes={classes} />
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}
