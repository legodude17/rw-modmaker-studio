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
  expandable,
}: {
  children: React.ReactNode;
  fieldName: string;
  actions?: React.ReactNode;
  summary?: React.ReactNode;
  expandable?: boolean;
}) => {
  return expandable ? (
    <Accordion
      style={{
        width: '100%',
      }}
      TransitionProps={{ unmountOnExit: true }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <p style={{ marginLeft: 10, flexGrow: 1 }}>{fieldName}</p>
        {summary}
      </AccordionSummary>
      <AccordionDetails style={{ display: 'flex', flexDirection: 'column' }}>
        {children}
      </AccordionDetails>
      {actions != null && <Divider />}
      {actions != null && <AccordionActions>{actions}</AccordionActions>}
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
  expandable: false,
};

export default FieldDisplay;
