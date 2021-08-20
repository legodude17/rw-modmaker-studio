import { Link as RouterLink, useHistory } from 'react-router-dom';
import {
  IconButton,
  Typography,
  AppBar,
  Toolbar,
  makeStyles,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import SettingsIcon from '@material-ui/icons/Settings';
import { ReactNode } from 'react';

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  title: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'row',
  },
}));

export default function MainAppToolbar({ children }: { children: ReactNode }) {
  const classes = useStyles();
  const history = useHistory();
  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <div className={classes.title}>
          <Typography variant="h6" style={{ marginRight: 15 }}>
            RimWorld Mod Maker Studio
          </Typography>
          {children}
        </div>
        <IconButton
          color="inherit"
          onClick={() =>
            history.location.pathname.endsWith('settings')
              ? history.goBack()
              : history.push('/settings')
          }
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
