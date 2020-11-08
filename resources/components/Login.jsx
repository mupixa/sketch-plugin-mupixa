import React from 'react';
import Section from "./Section";
import Button from '@material-ui/core/Button';

const styles = {
  text: {
    fontSize: "15px",
  },
};

const Login = (props) => {
  return (
    <div style={styles.text} >
      <Section align={"center"}>
        <div>
          <p>You need to login in order to use Mupixa Publisher.</p>
          <p>Clicking LOGIN opens mupixa.com in a browser window.</p>
          <p>Enter your Mupixa credentials and authorize the plugin.</p>
        </div>
      </Section>
      <Section align={"center"} margin={"20px"} >
      <span>
        <Button variant="text" color="primary" onClick={props.authorizeToken}>
          Login
        </Button>
      </span>
      </Section>
    </div>
  );
};

export default Login;
