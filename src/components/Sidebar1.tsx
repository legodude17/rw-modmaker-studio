import * as React from 'react';
import {
  Toolbar,
  Drawer,
  List as ListElement,
  ListItem,
  ListItemIcon,
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

function Sidebar1({
  classes,
  setTab,
  paperRef,
}: {
  classes: ClassNameMap<
    'drawer' | 'drawerPaper1' | 'drawerContainer' | 'listItem'
  >;
  setTab: (arg: SidebarTab) => void;
  paperRef: React.Ref<Node>;
}) {
  return (
    <Drawer
      className={classes.drawer}
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
