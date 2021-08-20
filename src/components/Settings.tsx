import * as React from 'react';
import {
  Button,
  Container,
  makeStyles,
  TextField,
  Toolbar,
} from '@material-ui/core';
import path from 'path';
import got from 'got';
import stream from 'stream';
import { promisify } from 'util';
import { createWriteStream } from 'fs';
import { settings, app } from '../electron';
import { prefs } from '../prefs';

const pipeline = promisify(stream.pipeline);
const set =
  (field: string, innerSet: React.Dispatch<React.SetStateAction<string>>) =>
  (event: React.ChangeEvent<HTMLInputElement>) =>
    // eslint-disable-next-line prettier/prettier
    (settings.set(field, event.target.value), innerSet(event.target.value)); // eslint-disable-line no-sequences

const useStyles = makeStyles((theme) => ({
  pathInput: {
    width: '100%',
    marginBottom: 10,
    '::after': {
      content: '\n',
    },
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

const PrefTextField = ({
  field,
  desc,
  className,
}: {
  field: string;
  desc: string;
  className: string;
}) => {
  const [val, setVal] = React.useState('');
  settings.get(field).then(setVal).catch(console.error);
  return (
    <TextField
      id="filled-basic"
      label={desc}
      variant="filled"
      onChange={set(field, setVal)}
      value={val}
      className={className}
    />
  );
};

export default function Settings() {
  const classes = useStyles();
  const [base, setBase] = React.useState('');
  const [_, temp] = React.useState(false);
  const update = () => temp((v) => !v);
  return (
    <Container maxWidth="xl" className={classes.container}>
      <Toolbar />
      <form noValidate autoComplete="off" style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <TextField
            style={{ flexGrow: 1 }}
            value={base}
            onChange={(event) => setBase(event.target.value)}
            helperText="Base Path to RimWorld folder"
            defaultValue="C:/Program Files (x86)/Steam/steamapps/common/RimWorld"
          />
          <Button
            onClick={() =>
              prefs.forEach((pref) =>
                settings.set(pref.name, pref.fromBase(base)).then(update)
              )
            }
          >
            Set From Base
          </Button>
        </div>
        {prefs.map((pref) => {
          if (pref.name === 'extractorpath') {
            return (
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <PrefTextField
                  field={pref.name}
                  desc={pref.desc}
                  className={classes.pathInput}
                  key={pref.name}
                />
                <Button
                  onClick={async () => {
                    const { headers } = await got(
                      'https://github.com/legodude17/extractor/releases/latest',
                      { followRedirects: false }
                    );
                    const tag = headers.location.split('/').slice(-1)[0];
                    const file = path.join(
                      await app.getPath('appData'),
                      'rw-modmaker',
                      'extractor'
                    );
                    await pipeline(
                      got.stream(
                        `https://github.com/legodude17/extractor/releases/download/${tag}/extractor.exe`
                      ),
                      createWriteStream(file)
                    );
                    await settings.set('extractorpath', file);
                    update();
                  }}
                >
                  Download Extractor
                </Button>
              </div>
            );
          }
          if (pref.type === 'string') {
            return (
              <PrefTextField
                field={pref.name}
                desc={pref.desc}
                className={classes.pathInput}
                key={pref.name}
              />
            );
          }
          return null;
        })}
      </form>
    </Container>
  );
}
