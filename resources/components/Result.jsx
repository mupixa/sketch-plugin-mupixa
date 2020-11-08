import { Button } from '@material-ui/core';
import React from 'react';
import { MUPIXA_APP_URL } from '../constants';
import Section from './Section';


const Result = (props) => {

  const openProject = (projectId) => {
    const url = `${MUPIXA_APP_URL}/prj/${projectId}`;
    window.postMessage('openLink', url);
  }

  return (
    <React.Fragment>
      <Section align={"center"}>
        {props.result}
      </Section>
      <Section align={"center"}>
        {!!props.projectId && (
          <Button variant="text" color="primary" onClick={() => openProject(props.projectId)}>
          Open
        </Button>
        )}
        <Button variant="text" color="primary" onClick={props.resetResult}>
          Ok
        </Button>
      </Section>
    </React.Fragment>
  );
};

export default Result;