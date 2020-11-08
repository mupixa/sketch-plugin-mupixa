import React from 'react';
import Button from '@material-ui/core/Button';
import Section from './Section';

const styles = {
  input: {
    padding: ".25rem",
    border: "1px solid #3F3F3F",
    color: "#3F3F3F",
    borderRadius: "3px",
    fontSize: "12px",
  },
  btn: {
    marginTop: "20px",
  }
}

const Publish = (props) => {

  const [name, setName] = React.useState('');

  return (
    <div>
      <Section align={"center"}>
        <p>Choose a name for your project:</p>
        <input
          style={styles.input}
          placeholder={'Name'}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </Section>
      <Section align={"center"} margin={"25px"}>
        <span style={styles.btn}>
          <Button disabled={!name} variant="text" color="primary" onClick={() => props.publish(name)}>
            Publish
          </Button>
        </span>
      </Section>
    </div>
  );
}

export default Publish;