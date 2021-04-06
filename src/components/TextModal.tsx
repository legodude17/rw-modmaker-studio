import * as React from 'react';
import {
  Paper,
  TextField,
  Button,
  TextFieldProps,
  Modal,
  CircularProgress,
} from '@material-ui/core';
import { ClassNameMap } from '@material-ui/styles';
import { Autocomplete } from '@material-ui/lab';
import { useHistory } from 'react-router';

function TextModal({
  openRef,
  onSubmit,
  classes,
  label,
  helperText,
  buttonText,
  autocomplete,
  to,
}: {
  openRef: React.MutableRefObject<() => void>;
  onSubmit: (arg: string) => void | Promise<void>;
  classes: ClassNameMap<'modal'>;
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
    <Modal open={open} onClose={() => setOpen(false)}>
      <Paper className={classes.modal} elevation={10}>
        {autocomplete == null ? (
          <TextField
            label={label}
            helperText={helperText}
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
            value={text || options[0] || 'Loading...'}
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
                helperText={helperText}
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
                  helperText = err;
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
      </Paper>
    </Modal>
  );
}

TextModal.defaultProps = {
  autocomplete: null,
  to: '',
};

export default TextModal;
