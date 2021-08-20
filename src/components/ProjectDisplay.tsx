import * as React from 'react';
import { makeStyles, Toolbar, useTheme } from '@material-ui/core';
import { ipcRenderer } from 'electron';
import { settings } from '../electron';
import ManifestDisplay from './ManifestDisplay';
import Sidebar1 from './Sidebar1';
import { CodeTab, SearchTab } from './Sidebar2';
import { Project } from '../Project';
import DefDisplay from './DefDisplay';
import { getId, SidebarTab, DispatchContext, DefsContext } from '../util';
import AddDefModal from './AddDefModal';

function useWidth(deps: React.DependencyList): [number, React.Ref<Node>] {
  const [width, setWidth] = React.useState(0);

  const measureRef = React.useCallback((node) => {
    if (node !== null) {
      setWidth(node.getBoundingClientRect().width);
    }
  }, deps);

  return [width, measureRef];
}

function TabHelper({
  children,
  wantTab,
  curTab,
}: {
  wantTab: SidebarTab;
  curTab: SidebarTab;
  children: React.ReactNode;
}) {
  return <>{curTab === wantTab && children}</>;
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    left: 'auto',
  },
}));

function ProjectDisplay({ project }: { project: Project }) {
  const classes = useStyles();
  const dispatch = React.useContext(DispatchContext);
  const [tab, setTab] = React.useState(SidebarTab.Code);
  const [counter, setCounter] = React.useState(0);
  const update = React.useCallback(() => setCounter((num) => num + 1), []);
  const [small, sidebar1Ref] = useWidth([counter]);
  const [large, sidebar2Ref] = useWidth([project.defs, counter]);
  const addDefRef = React.useRef(() => null);

  React.useEffect(() => {
    const addDef = () => addDefRef.current();
    ipcRenderer.on('new-def', addDef);
    return () => {
      ipcRenderer.off('new-def', addDef);
    };
  }, [dispatch]);
  // React.useEffect(() => {
  //   Data.regenerate(project.manifest.deps, project.folder);
  // }, [project.manifest.deps, project.folder]);
  React.useEffect(() => {
    if (project.folder) settings.set('projectfolder', project.folder);
  }, [project.folder]);
  const usedTheme = useTheme();

  return (
    <>
      <Sidebar1 setTab={setTab} paperRef={sidebar1Ref} />
      <TabHelper curTab={tab} wantTab={SidebarTab.Code}>
        <CodeTab
          project={project}
          setCurrent={(current) =>
            dispatch({
              type: 'set',
              path: ['current'],
              newValue: current,
            })
          }
          paperRef={sidebar2Ref}
          margin={small}
          update={update}
        />
      </TabHelper>
      <TabHelper curTab={tab} wantTab={SidebarTab.Search}>
        <SearchTab
          setCurrent={(current) =>
            dispatch({
              type: 'set',
              path: ['current'],
              newValue: current,
            })
          }
          paperRef={sidebar2Ref}
          margin={small}
        />
      </TabHelper>
      <main
        className={classes.content}
        style={{
          marginLeft: small + large,
          transition: usedTheme.transitions.create('margin-left'),
        }}
      >
        <Toolbar />
        {project.current === '.manifest' ? (
          <ManifestDisplay manifest={project.manifest} />
        ) : (
          <DefsContext.Provider
            value={{ defs: project.defs.toArray(), folder: project.folder }}
          >
            <DefDisplay
              def={project.defs.find((def) => getId(def) === project.current)}
              defIndex={project.defs.findIndex(
                (def) => getId(def) === project.current
              )}
            />
          </DefsContext.Provider>
        )}
      </main>
      <AddDefModal
        project={project}
        openRef={addDefRef}
        addDef={(def) =>
          dispatch({
            type: 'add',
            path: ['defs'],
            newValue: def,
          })
        }
      />
    </>
  );
}

export default React.memo(
  ProjectDisplay,
  (prevState, nextState) =>
    prevState.project.folder === nextState.project.folder &&
    prevState.project.equals(nextState.project)
);
