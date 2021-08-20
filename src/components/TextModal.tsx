import * as React from 'react';
import {
  TextField,
  Button,
  TextFieldProps,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useHistory } from 'react-router';

function TextModal({
  openRef,
  onSubmit,
  label,
  helperText,
  buttonText,
  autocomplete,
  to,
}: {
  openRef: React.MutableRefObject<() => void>;
  onSubmit: (arg: string) => void | Promise<void>;
  label: string;
  helperText: string;
  buttonText: string;
  autocomplete?: () => string[] | Promise<string[]>;
  to?: string;
}) {
  const history = useHistory();
  const [text, setText] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<string[]>([]);
  const [waiting, setWaiting] = React.useState(false);
  const loading = open && options.length === 0 && autocomplete != null;
  const [error, setError] = React.useState(false);
  const [help, setHelp] = React.useState(helperText);

  React.useEffect(() => {
    let active = true;

    if (!loading || autocomplete == null) {
      return undefined;
    }

    (async () => {
      const response = await autocomplete();

      if (active) {
        setOptions(response);
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, autocomplete]);

  if (openRef) {
    openRef.current = () => setOpen(true);
  }
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>{label}</DialogTitle>
      <DialogContent>
        {autocomplete == null ? (
          <TextField
            label={label}
            helperText={help}
            onChange={(event) => setText(event.target.value)}
            value={text}
            style={{ marginBottom: 10 }}
            error={error}
            autoFocus
          />
        ) : (
          <Autocomplete
            options={options}
            onChange={(_event, newValue) => setText(newValue as string)}
            inputValue={text || 'Loading...'}
            style={{ marginBottom: 10 }}
            getOptionLabel={(a) => a ?? ''}
            loading={loading}
            renderInput={(params: TextFieldProps) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...params}
                label={label}
                variant="outlined"
                error={error}
                helperText={help}
                autoFocus
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps?.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={waiting}
          onClick={() => {
            const res = onSubmit(text);
            setText('');
            if (res) {
              setWaiting(true);
              res
                .then(() => {
                  setWaiting(false);
                  setOpen(false);
                  setError(false);
                  if (to) history.push(to);
                  return null;
                })
                .catch((err) => {
                  setWaiting(false);
                  setHelp(err);
                  setError(true);
                });
            } else {
              setOpen(false);
            }
          }}
        >
          {buttonText}
          {waiting ? <CircularProgress color="inherit" size={20} /> : null}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

TextModal.defaultProps = {
  autocomplete: null,
  to: '',
};

export default TextModal;
