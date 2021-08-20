import { Paper, Toolbar, Typography } from '@material-ui/core';
import { memo, useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { settings } from '../electron';
import { DispatchContext } from '../util';
import { makeProject } from '../Project';

function Landing({ loaded }: { loaded: boolean }) {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const history = useHistory();
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
    if (loaded) history.push('/project');
    else
      (async () => {
        const folder = (await settings.get('projectfolder')) as string;
        if (folder) {
          dispatch({
            type: 'switch',
            path: ['.'],
            newValue: makeProject({ folder }),
          });
          history.push('/loading');
        }
      })();
  }, [dispatch, history, loaded]);
  return (
    <>
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
        <Typography variant="h4" align="center" gutterBottom>
          Welcome to RimWorld Mod Maker Studio!
        </Typography>
        <Typography variant="body2" align="center">
          Go to File -&gt; Open or File -&gt; New Project to get started
        </Typography>
      </Paper>
    </>
  );
}

export default memo(Landing, () => true);
