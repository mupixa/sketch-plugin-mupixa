
import React from 'react';
import { IMPRINT_URL, VERSION } from "../constants";
import Section from "./Section";

const styles = {
  text: {
    fontSize: "15px",
  },
};

const About = (props) => {
  return (
    <div style={styles.text}>
      <Section align={"center"}>
        <p>Mupixa Publisher lets you upload your design prototypes to <a href="https://mupixa.com">Mupixa</a>.</p>
        <p>Once uploaded you can conduct moderated and unmoderated usability tests by inviting users to try your prototype.</p>
        <p>To use Mupixa you need an account.</p>
        <div>{`Version: ${VERSION}`}</div>
      </Section>
    </div>
  );
};

export default About;
