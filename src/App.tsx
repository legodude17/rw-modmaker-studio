import * as React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import { List } from 'immutable';
import path from 'path';
import settings from 'electron-settings';
import { promises as fs } from 'fs';
import makeStyles from './styles';
import Settings from './Settings';
import theme from './theme';
import TextModal from './components/TextModal';
import { DataContext, DispatchContext } from './util';
import { makeProject, Project, ProjectAction, NewValue } from './Project';
import ProjectDisplay from './components/ProjectDisplay';
import Landing from './components/Landing';
import Loading from './components/Loading';
import { DataManager } from './DataManagerType';

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

const useStyles = makeStyles();

export default function App() {
  const classes = useStyles();
  const openNewProjectDialog = React.useRef(() => null);
  const openOpenProjectDialog = React.useRef(() => null);
  React.useEffect(() => {
    const newProjectHook = () => openNewProjectDialog.current();
    const openProjectHook = () => openOpenProjectDialog.current();
    ipcRenderer.on('new-project', newProjectHook);
    ipcRenderer.on('open-project', openProjectHook);
    return () => {
      ipcRenderer.off('new-project', newProjectHook);
      ipcRenderer.off('open-project', openProjectHook);
    };
  }, []);

  const [project, dispatch] = React.useReducer<
    React.Reducer<Project, ProjectAction>,
    undefined
  >(projectReducer, undefined, makeProject);
  const [Data, setData] = React.useState<DataManager | undefined>();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Switch>
          <Route path="/project">
            <DataContext.Provider value={Data}>
              <DispatchContext.Provider value={dispatch}>
                <ProjectDisplay classes={classes} project={project} />
              </DispatchContext.Provider>
            </DataContext.Provider>
          </Route>
          <Route path="/loading">
            <Loading
              classes={classes}
              project={project}
              setProject={(proj) => {
                console.log('New project:', proj);
                dispatch({
                  type: 'switch',
                  path: ['.'],
                  newValue: proj,
                });
              }}
              setData={setData}
            />
          </Route>
          <Route path="/settings">
            <Settings classes={classes} />
          </Route>
          <Route path="/">
            <Landing classes={classes} />
          </Route>
        </Switch>

        <TextModal
          openRef={openNewProjectDialog}
          to="/loading"
          onSubmit={(name) =>
            settings
              .get('rwlocalmods')
              .then((s) => path.join(s as string, name))
              .then(
                (folder) =>
                  new Promise((resolve, reject) =>
                    fs
                      .access(folder)
                      .then(() => reject('Folder exists'))
                      .catch(() => {
                        dispatch({
                          type: 'switch',
                          path: ['.'],
                          newValue: makeProject({ folder }),
                        });
                        resolve();
                      })
                  )
              )
          }
          classes={classes}
          label="New Project"
          helperText="The name of the folder to create in your mod folder"
          buttonText="Create!"
        />

        <TextModal
          openRef={openOpenProjectDialog}
          to="/loading"
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
          }
          classes={classes}
          label="Open Project"
          helperText="The name of the folder to open"
          buttonText="Open"
          autocomplete={() =>
            settings.get('rwlocalmods').then((loc) => fs.readdir(loc as string))
          }
        />
      </Router>
    </ThemeProvider>
  );
}
