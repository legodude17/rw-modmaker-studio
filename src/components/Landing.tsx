import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import { Paper, Toolbar, Typography } from '@material-ui/core';
import { memo, useEffect, useState } from 'react';
import MainAppToolbar from './MainAppToolbar';

function Landing({
  classes,
}: {
  classes: ClassNameMap<'root' | 'appBar' | 'title'>;
}) {
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
          <Typography variant="h4" align="center" gutterBottom>
            Welcome to RimWorld Mod Maker Studio!
          </Typography>
          <Typography variant="body2" align="center">
            Go to File -&gt; Open or File -&gt; New Project to get started
          </Typography>
        </Paper>
      </div>
    </div>
  );
}

export default memo(Landing, () => true);
