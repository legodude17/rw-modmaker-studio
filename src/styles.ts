import { makeStyles } from '@material-ui/core/styles';

export default () =>
  makeStyles((theme) => ({
    root: {
      display: 'flex',
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
    },
    drawer: {},
    drawerPaper1: {
      left: 'auto',
      position: 'fixed',
    },
    drawerPaper2: {
      zIndex: theme.zIndex.drawer - 1,
      left: 'auto',
      position: 'fixed',
    },
    drawerContainer: {
      overflow: 'auto',
      overflowX: 'hidden',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      left: 'auto',
    },
    pathInput: {
      width: '100%',
      marginBottom: 10,
      '::after': {
        content: '\n',
      },
    },
    title: {
      flexGrow: 1,
    },
    container: {
      paddingTop: theme.spacing(4),
      paddingBottom: theme.spacing(4),
    },
    listItem: {
      margin: 0,
      padding: 5,
      display: 'block',
      position: 'relative',
      minWidth: 10,
      marginBottom: 5,
    },
    modal: {
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      border: '2px solid',
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
      top: '50%',
      left: '50%',
      minWidth: 500,
      minHeight: 300,
      transform: 'translate(-50%, -50%)',
    },
  }));
