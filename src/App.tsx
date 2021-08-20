/* eslint-disable promise/no-nesting */
import * as React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import {
  CssBaseline,
  makeStyles,
  ThemeProvider,
  Typography,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import { formatDistance } from 'date-fns';
import { defaultPrefs } from './prefs';
import { settings } from './electron';
import Settings from './components/Settings';
import theme from './theme';
import TextModal from './components/TextModal';
import { DataContext, DispatchContext, projectReducer } from './util';
import { makeProject, Project, ProjectAction } from './Project';
import ProjectDisplay from './components/ProjectDisplay';
import Landing from './components/Landing';
import Loading from './components/Loading';
import { DataManager } from './DataManagerType';
import MainAppToolbar from './components/MainAppToolbar';
import log from './log';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
  },
}));

export default function App() {
  const classes = useStyles();
  const openNewProjectDialog = React.useRef(() => null);
  const openOpenProjectDialog = React.useRef(() => null);
  const [project, dispatch] = React.useReducer<
    React.Reducer<Project, ProjectAction>,
    undefined
  >(projectReducer, undefined, makeProject);
  const [Data, setData] = React.useState<DataManager | undefined>();
  const [lastSave, setLastSave] = React.useState<Date | boolean>(new Date());
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    settings.init(defaultPrefs);
    log.init();
  }, []);
  React.useEffect(() => {
    const newProjectHook = () => openNewProjectDialog.current();
    const openProjectHook = () => openOpenProjectDialog.current();
    async function save() {
      setLastSave(false);
      await ipcRenderer.invoke('save', project.toJS());
      setLastSave(new Date());
    }
    ipcRenderer.on('new-project', newProjectHook);
    ipcRenderer.on('open-project', openProjectHook);
    ipcRenderer.on('save', save);
    return () => {
      ipcRenderer.off('new-project', newProjectHook);
      ipcRenderer.off('open-project', openProjectHook);
      ipcRenderer.off('save', save);
    };
  }, [project]);
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 500);
    return () => clearInterval(id);
  });

  window.Data = Data;
  window.Project = project;
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <DispatchContext.Provider value={dispatch}>
          <div className={classes.root}>
            <MainAppToolbar>
              <Typography variant="h6">
                {typeof lastSave !== 'boolean'
                  ? `(last save ${formatDistance(lastSave, now, {
                      addSuffix: true,
                      includeSeconds: true,
                    })})`
                  : '(saving...)'}
              </Typography>
            </MainAppToolbar>
            <Switch>
              <Route path="/project">
                <DataContext.Provider value={Data}>
                  <ProjectDisplay project={project} />
                </DataContext.Provider>
              </Route>
              <Route path="/loading">
                <Loading project={project} setData={setData} />
              </Route>
              <Route path="/settings">
                <Settings />
              </Route>
              <Route path="/">
                <Landing loaded={project.loaded} />
              </Route>
            </Switch>
          </div>
        </DispatchContext.Provider>

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
                      .then(() => reject(new Error('Folder exists')))
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
