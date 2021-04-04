import { useContext } from 'react';
import {
  IconButton,
  List as ListElement,
  ListItem,
  Paper,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
} from '@material-ui/core';
import { List } from 'immutable';
import CloseIcon from '@material-ui/icons/Close';
import { LoadType, makeMod, ModManifest, ModManifestProps } from '../Project';
import * as Data from '../DataManager';
import { DispatchContext } from '../misc';
import FieldDisplay from './FieldDisplay';
import AddMod from './AddMod';
import ModDisplay from './ModDisplay';
import SimpleText from './SimpleText';

export default function ManifestDisplay({
  manifest,
}: {
  manifest: ModManifest;
}) {
  const dispatch = useContext(DispatchContext);
  return (
    <Paper elevation={2}>
      <ListElement>
        {['name', 'id', 'author', 'desc', 'url'].map((key) => (
          <ListItem key={key}>
            <FieldDisplay fieldName={key}>
              <SimpleText
                value={manifest.get(key as keyof ModManifestProps) as string}
                multiline={key === 'desc'}
                path={['manifest', key]}
                style={{ width: '50%' }}
              />
            </FieldDisplay>
          </ListItem>
        ))}
        <ListItem key="deps">
          <FieldDisplay
            fieldName="Dependencies"
            actions={
              <AddMod
                add={(modName) => {
                  const mod = Data.modByName(modName);
                  dispatch({
                    type: 'add',
                    path: ['manifest', 'deps'],
                    newValue: makeMod({
                      name: mod?.name ?? modName,
                      id: mod?.id,
                      workshop: mod?.wshopId
                        ? `https://steamcommunity.com/sharedfiles/filedetails/?id=${mod?.wshopId}`
                        : undefined,
                      path: mod?.path,
                      url: mod?.url,
                    }),
                  });
                }}
                prop="name"
              />
            }
          >
            {manifest.deps != null &&
              manifest.deps.map((dep, i) => (
                <ModDisplay
                  path={['manifest', 'deps', i.toString()]}
                  key={dep.name}
                  value={dep}
                />
              ))}
          </FieldDisplay>
        </ListItem>
        <ListItem key="versions">
          <FieldDisplay fieldName="Versions">
            {['1.0', '1.1', '1.2'].map((ver) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={manifest.versions.contains(ver)}
                    onChange={() => {
                      dispatch({
                        type: manifest.versions.contains(ver)
                          ? 'remove'
                          : 'add',
                        path: ['manifest', 'versions'],
                        newValue: ver,
                      });
                    }}
                    name={ver}
                  />
                }
                label={ver}
                key={ver}
              />
            ))}
          </FieldDisplay>
        </ListItem>
        <ListItem key="incompat">
          <FieldDisplay
            fieldName="incompat"
            actions={
              <AddMod
                add={(mod) =>
                  dispatch({
                    type: 'add',
                    path: ['manifest', 'incompat'],
                    newValue: mod,
                  })
                }
                prop="id"
              />
            }
          >
            {manifest.incompat != null &&
              (manifest.incompat as List<string>).map((dep, i) => (
                <SimpleText
                  key={dep}
                  path={['manifest', 'incompat', i.toString()]}
                  style={{
                    width: '100%',
                    margin: 10,
                  }}
                  value={dep}
                />
              ))}
          </FieldDisplay>
        </ListItem>
        <ListItem key="loadRules">
          <FieldDisplay
            fieldName="loadRules"
            actions={
              <AddMod
                add={(mod) =>
                  dispatch({
                    type: 'set',
                    path: ['manifest', 'loadRules', mod],
                    newValue: LoadType.After,
                  })
                }
                prop="id"
              />
            }
          >
            {manifest.loadRules
              .map((load, mod) => (
                <div
                  key={mod}
                  style={{ display: 'flex', flexDirection: 'row' }}
                >
                  <p style={{ width: '50%', flexGrow: 1 }}>{mod}</p>
                  <TextField
                    value={load === LoadType.Before ? 'before' : 'after'}
                    style={{ width: '15%' }}
                    select
                    onChange={(event) =>
                      dispatch({
                        type: 'set',
                        path: ['manifest', 'loadRules', mod],
                        newValue:
                          event.target.value === 'before'
                            ? LoadType.Before
                            : LoadType.After,
                      })
                    }
                  >
                    <MenuItem value="before">Load Before</MenuItem>
                    <MenuItem value="after">Load After</MenuItem>
                  </TextField>
                  <IconButton
                    onClick={() =>
                      dispatch({
                        type: 'remove',
                        path: ['manifest', 'loadRules', mod],
                        newValue: '',
                      })
                    }
                    style={{ marginLeft: '10%' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              ))
              .valueSeq()}
          </FieldDisplay>
        </ListItem>
      </ListElement>
    </Paper>
  );
}
