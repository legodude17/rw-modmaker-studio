import { useContext, useState, useRef } from 'react';
import {
  IconButton,
  Paper,
  TextField,
  Button,
  TextFieldProps,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CloseIcon from '@material-ui/icons/Close';
import { makeMod, Mod } from '../Project';
import { DispatchContext, DataContext } from '../util';

export default ({ path, value }: { path: string[]; value: Mod }) => {
  const Data = useContext(DataContext);
  const dispatch = useContext(DispatchContext);
  const [chosenMod, setChosenMod] = useState<null | string>(value.name ?? null);
  const refs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];
  return (
    <Paper
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 15,
        marginBottom: 10,
      }}
      color="secondary"
      elevation={5}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          marginBottom: 10,
        }}
      >
        <Autocomplete
          options={Data.data.mods.map((mod) => mod.name)}
          getOptionLabel={(a) => a}
          renderInput={(params: TextFieldProps) => (
            <TextField
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...params}
              label="Mod Name"
              variant="outlined"
              onBlur={(event) =>
                dispatch({
                  type: 'set',
                  path: [...path, 'name'],
                  newValue: event.target.value,
                })
              }
            />
          )}
          freeSolo
          clearOnBlur={false}
          value={chosenMod}
          onChange={(_event, newValue: null | string) => {
            setChosenMod(newValue);
          }}
          style={{ width: '50%', marginRight: 20 }}
        />
        <Button
          style={{
            padding: 2,
            margin: 5,
            marginRight: 20,
            paddingRight: 10,
            paddingLeft: 10,
          }}
          variant="outlined"
          disabled={chosenMod == null || Data?.modByName(chosenMod) == null}
          onClick={() => {
            if (chosenMod == null) return;
            const mod = Data?.modByName(chosenMod);
            if (mod == null) return;
            const newMod = makeMod({
              name: mod?.name,
              id: mod?.id,
              workshop: mod?.wshopId
                ? `https://steamcommunity.com/sharedfiles/filedetails/?id=${mod?.wshopId}`
                : undefined,
              path: mod?.path,
              url: mod?.url,
            });
            if (refs.every((ref) => ref.current != null)) {
              refs[0].current.value = newMod.id;
              refs[1].current.value = newMod.workshop;
              refs[2].current.value = newMod.url;
              refs[3].current.value = newMod.path;
            }
            dispatch({
              type: 'set',
              path,
              newValue: newMod,
            });
          }}
        >
          Autofill from Name
        </Button>
        <TextField
          defaultValue={value.id}
          InputLabelProps={{ shrink: true }}
          onBlur={(event) =>
            dispatch({
              type: 'set',
              path: [...path, 'id'],
              newValue: event.target.value,
            })
          }
          style={{
            flexGrow: 1,
          }}
          label="Package Id"
          inputRef={refs[0]}
        />
        <IconButton
          onClick={() =>
            dispatch({
              type: 'remove',
              path,
              newValue: '',
            })
          }
          style={{ marginLeft: '10%' }}
        >
          <CloseIcon />
        </IconButton>
      </div>
      <TextField
        defaultValue={value.workshop}
        InputLabelProps={{ shrink: true }}
        onBlur={(event) =>
          dispatch({
            type: 'set',
            path: [...path, 'workshop'],
            newValue: event.target.value,
          })
        }
        label="Workshop URL"
        inputRef={refs[1]}
        style={{ marginBottom: 15 }}
      />
      <TextField
        defaultValue={value.url}
        InputLabelProps={{ shrink: true }}
        onBlur={(event) =>
          dispatch({
            type: 'set',
            path: [...path, 'url'],
            newValue: event.target.value,
          })
        }
        label="Download Url"
        inputRef={refs[2]}
        style={{ marginBottom: 15 }}
      />
      <TextField
        defaultValue={value.path}
        InputLabelProps={{ shrink: true }}
        onBlur={(event) =>
          dispatch({
            type: 'set',
            path: [...path, 'path'],
            newValue: event.target.value,
          })
        }
        label="Folder Path"
        helperText="Path to the mod on disk, used to load it's defs and assemblies"
        inputRef={refs[3]}
        style={{ marginBottom: 15 }}
      />
    </Paper>
  );
};
