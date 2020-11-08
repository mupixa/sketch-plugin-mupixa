import React from 'react';

const styles = {
  footer: {
    position: "fixed",
    bottom: "8px",
    left: "8px",
    width: "100%",
    fontSize: "13px"
  },
};

const Footer = (props) => {
  return (
  <div style={styles.footer}>
    {props.children}
  </div>
  )}

export default Footer;