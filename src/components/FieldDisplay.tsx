import * as React from 'react';
import {
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Divider,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const FieldDisplay = ({
  children,
  fieldName,
  actions,
  summary,
}: {
  children: React.ReactNode | React.ReactNode[];
  fieldName: string;
  actions?: React.ReactNode | React.ReactNode[];
  summary?: React.ReactNode;
}) => {
  const hasActions = actions != null;
  const isExpandable =
    hasActions ||
    (children != null &&
      Array.isArray(children) &&
      (children as Array<React.ReactNode>).length !== 0);
  return isExpandable ? (
    <Accordion
      style={{
        width: '100%',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <p style={{ marginLeft: 10, flexGrow: 1 }}>{fieldName}</p>
        {summary}
      </AccordionSummary>
      <AccordionDetails style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </AccordionDetails>
      {hasActions && <Divider />}
      {hasActions && <AccordionActions>{actions}</AccordionActions>}
    </Accordion>
  ) : (
    <Paper
      elevation={3}
      style={{
        padding: 10,
        width: '100%',
        flexDirection: 'row',
        display: 'flex',
      }}
    >
      <p style={{ marginLeft: 10, width: '50%' }} key={fieldName}>
        {fieldName}
      </p>
      {children}
    </Paper>
  );
};

FieldDisplay.defaultProps = {
  actions: null,
  summary: null,
};

export default FieldDisplay;
