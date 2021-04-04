import { Link as RouterLink, useHistory } from 'react-router-dom';
import { IconButton, Typography, AppBar, Toolbar } from '@material-ui/core';
import { ClassNameMap } from '@material-ui/styles';
import MenuIcon from '@material-ui/icons/Menu';
import SettingsIcon from '@material-ui/icons/Settings';

export default function MainAppToolbar({
  classes,
}: {
  classes: ClassNameMap<'appBar' | 'title'>;
}) {
  const history = useHistory();
  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          RimWorld Mod Maker Studio
        </Typography>
        <IconButton
          color="inherit"
          component={RouterLink}
          to={
            history.location.pathname.endsWith('/settings') ? '/' : '/settings'
          }
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
