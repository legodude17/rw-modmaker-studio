import * as React from 'react';
import {
  Toolbar,
  Drawer,
  List as ListElement,
  ListItem,
  ListItemIcon,
  makeStyles,
} from '@material-ui/core';
import { ClassNameMap } from '@material-ui/styles';
import CodeIcon from '@material-ui/icons/Code';
import SearchIcon from '@material-ui/icons/Search';
import { SidebarTab } from '../util';

function TabButton({ tab }: { tab: SidebarTab }) {
  switch (tab) {
    case SidebarTab.Code:
      return <CodeIcon fontSize="large" />;
    case SidebarTab.Search:
      return <SearchIcon fontSize="large" />;
    default:
      return null;
  }
}

const useStyles = makeStyles((theme) => ({
  drawerPaper1: {
    left: 'auto',
    position: 'fixed',
  },
  listItem: {
    margin: 0,
    padding: 5,
    display: 'block',
    position: 'relative',
    minWidth: 10,
    marginBottom: 5,
  },
  drawerContainer: {
    overflow: 'auto',
    overflowX: 'hidden',
  },
}));

function Sidebar1({
  setTab,
  paperRef,
}: {
  setTab: (arg: SidebarTab) => void;
  paperRef: React.Ref<Node>;
}) {
  const classes = useStyles();

  return (
    <Drawer
      variant="permanent"
      classes={{
        paper: classes.drawerPaper1,
      }}
      PaperProps={{ ref: paperRef }}
    >
      <Toolbar />
      <div className={classes.drawerContainer}>
        <ListElement>
          {[SidebarTab.Code, SidebarTab.Search].map((type) => (
            <ListItem
              button
              key={type}
              className={classes.listItem}
              onClick={() => setTab(type)}
            >
              <ListItemIcon className={classes.listItem}>
                <TabButton tab={type} />
              </ListItemIcon>
            </ListItem>
          ))}
        </ListElement>
      </div>
    </Drawer>
  );
}

export default React.memo(Sidebar1);
