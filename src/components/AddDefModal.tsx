import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import {
  MutableRefObject,
  useContext,
  useReducer,
  useState,
  Reducer,
} from 'react';
import {
  DispatchContext,
  DefsContext,
  DataContext,
  projectReducer,
} from '../util';
import { Project, Def, ProjectAction, makeDef } from '../Project';
import MetaDefFields from './MetaDefFields';
import SimpleAutocomplete from './SimpleAutocomplete';
import { fullType } from '../DataManager';

function AddDefModal({
  project,
  openRef,
  addDef,
}: {
  project: Project;
  openRef: MutableRefObject<() => void>;
  addDef: (def: Def) => void;
}) {
  const [open, setOpen] = useState(false);
  const [def, dispatch] = useReducer<Reducer<Def, ProjectAction>, undefined>(
    projectReducer,
    undefined,
    makeDef
  );
  const Data = useContext(DataContext);

  console.log(def.toJS());

  if (openRef) {
    openRef.current = () => setOpen(true);
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xl">
      <DialogTitle>Add Def</DialogTitle>
      <DialogContent>
        <DefsContext.Provider
          value={{ defs: project.defs.toArray(), folder: project.folder }}
        >
          <DispatchContext.Provider value={dispatch}>
            <MetaDefFields def={def} path={[]} />
            <SimpleAutocomplete
              options={
                Data?.allChildren(Data.typeByName('Verse.Def'))?.map((t) =>
                  t.typeIdentifier
                    .replace('RimWorld.', '')
                    .replace('Verse.', '')
                ) ?? []
              }
              transformValue={(arg) => fullType(arg, undefined, Data) ?? arg}
              value={def.type}
              path={['type']}
              textFieldProps={{ fullWidth: true }}
            />
          </DispatchContext.Provider>
        </DefsContext.Provider>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          onClick={() => {
            addDef(def);
            setOpen(false);
          }}
        >
          Add!
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddDefModal;
