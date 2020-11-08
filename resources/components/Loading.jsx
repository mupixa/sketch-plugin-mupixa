import React from 'react';
import { CircularProgress } from '@material-ui/core';
import Section from './Section';

const processingSteps = [
  'Loading',
  'Rendering artboards',
  'Creating project',
  'Uploading artboards',
  'Assigning uploaded artboards to the project'
];

const Loading = (props) => {
  return (
    <Section align={"center"}>
      <div>
          <CircularProgress />
      </div>
      <div style={{ marginTop: '15px' }}>
          <span>{processingSteps[props.processingStep]} &hellip;</span>
      </div>
    </Section>
  )
}

export default Loading;