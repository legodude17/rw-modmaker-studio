import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import {
  CircularProgress,
  Paper,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { memo, useEffect, useState } from 'react';
import { promises as fs, constants } from 'fs';
import { basename, join } from 'path';
import { useHistory } from 'react-router';
import { ipcRenderer } from 'electron';
import MainAppToolbar from './MainAppToolbar';
import { fromJS, makeManifest, makeProject, Project } from '../Project';
import { createManager } from '../DataManager';
import { DataManager } from '../DataManagerType';

function Loading({
  classes,
  project,
  setProject,
  setData,
}: {
  classes: ClassNameMap<'root' | 'appBar' | 'title'>;
  project: Project;
  setProject: (arg: Project) => void;
  setData: (Data: DataManager) => void;
}) {
  const history = useHistory();
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  useEffect(() => {
    function onresize() {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    }
    window.addEventListener('resize', onresize);
    return () => window.removeEventListener('resize', onresize);
  }, []);
  useEffect(() => {
    (async () => {
      try {
        await fs.access(project.folder, constants.R_OK);
        setProject(
          fromJS(await ipcRenderer.invoke('read-project', project.folder))
        );
        setData(
          createManager(
            JSON.parse(
              await fs.readFile(join(project.folder, '_info.json'), 'utf-8')
            )
          )
        );
        history.push('/project');
      } catch (e) {
        console.log(e);
        await fs.mkdir(project.folder);
        const newProj = makeProject({
          folder: project.folder,
          manifest: makeManifest({
            name: basename(project.folder),
            author: 'you',
            id: `you.${basename(project.folder).toLowerCase()}`,
          }),
        });
        // await writeProject(newProj)
        setProject(newProj);
        history.push('/project');
      }
    })();
  }, [project.folder]);
  return (
    <div className={classes.root}>
      <MainAppToolbar classes={classes} />
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
    </div>
  );
}

export default memo(Loading, () => true);
