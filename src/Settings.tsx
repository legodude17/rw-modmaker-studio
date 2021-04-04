import React from 'react';
import settings from 'electron-settings';
import { Container, TextField } from '@material-ui/core';
import clsx from 'clsx';
import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import MainAppToolbar from './components/MainAppToolbar';

const set = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) =>
  settings.set(field, event.target.value);

const PrefTextField = ({
  field,
  desc,
  className,
}: {
  field: string;
  desc: string;
  className: string;
}) => (
  <TextField
    id="filled-basic"
    label={desc}
    variant="filled"
    onChange={set(field)}
    defaultValue={settings.getSync(field)}
    className={className}
  />
);

export default function Settings({
  classes,
}: {
  classes: ClassNameMap<
    | 'root'
    | 'content'
    | 'appBar'
    | 'pathInput'
    | 'title'
    | 'container'
    | 'listItem'
  >;
}) {
  return (
    <div>
      <MainAppToolbar classes={classes} />
      <Container
        maxWidth="xl"
        className={clsx(classes.root, classes.container)}
      >
        <form noValidate autoComplete="off" style={{ width: '100%' }}>
          <PrefTextField
            field="rwexec"
            desc="RimWorld Executable Path"
            className={classes.pathInput}
          />
          <PrefTextField
            field="rwlocalmods"
            desc="RimWorld Local Mod Folder Path"
            className={classes.pathInput}
          />
          <PrefTextField
            field="rwassem"
            desc="RimWorld Assembly Path"
            className={classes.pathInput}
          />
          <PrefTextField
            field="unityassem"
            desc="UnityEngine Assembly Path"
            className={classes.pathInput}
          />
          <PrefTextField
            field="extractorpath"
            desc="Path to Field Extractor"
            className={classes.pathInput}
          />
          <PrefTextField
            field="rwdata"
            desc="Path to RimWorld Data Folder"
            className={classes.pathInput}
          />
        </form>
      </Container>
    </div>
  );
}
