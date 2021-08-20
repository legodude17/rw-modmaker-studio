import {
  CircularProgress,
  Paper,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { memo, useContext, useEffect, useState } from 'react';
import { promises as fs, constants } from 'fs';
import { basename, join } from 'path';
import { useHistory } from 'react-router';
import { ipcRenderer } from 'electron';
import { fromJS, makeManifest, makeProject, Project } from '../Project';
import { createManager } from '../DataManager';
import { DataManager } from '../DataManagerType';
import { DispatchContext } from '../util';

function Loading({
  project,
  setData,
}: {
  project: Project;
  setData: (Data: DataManager) => void;
}) {
  const history = useHistory();
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const dispatch = useContext(DispatchContext);
  useEffect(() => {
    function onresize() {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    }
    window.addEventListener('resize', onresize);
    return () => window.removeEventListener('resize', onresize);
  }, []);
  useEffect(() => {
    if (project.loaded) history.push('/project');
    else
      (async () => {
        try {
          await fs.access(project.folder, constants.R_OK);
          dispatch({
            type: 'switch',
            path: ['.'],
            newValue: fromJS(
              await ipcRenderer.invoke('read-project', project.folder)
            ),
          });
          setData(
            createManager(
              JSON.parse(
                await fs.readFile(join(project.folder, '_data.json'), 'utf-8')
              )
            )
          );
          history.push('/project');
        } catch (e) {
          await fs.mkdir(project.folder);
          const newProj = makeProject({
            folder: project.folder,
            manifest: makeManifest({
              name: basename(project.folder),
              author: 'you',
              id: `you.${basename(project.folder)
                .toLowerCase()
                .replaceAll(' ', '')}`,
            }),
            loaded: true,
          });
          // await writeProject(newProj)
          dispatch({
            type: 'switch',
            path: ['.'],
            newValue: newProj,
          });
          history.push('/project');
        }
      })();
  }, [dispatch, history, project.folder, project.loaded, setData]);
  return (
    <div style={{ flexGrow: 1 }}>
      <Toolbar />
      <Paper
        style={{
          left: width / 2,
          top: height / 2,
          transform: 'translate(-50%, -50%)',
          position: 'absolute',
          padding: 50,
        }}
      >
        <Typography variant="h6" align="center">
          Loading Project...
        </Typography>
        <CircularProgress />
      </Paper>
    </div>
  );
}

export default memo(Loading, () => true);
