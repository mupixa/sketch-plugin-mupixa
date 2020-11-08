import React from 'react';
import icon from './images/icon.png';

const styles = {
  header: {
    position: "relative",
    height: "70px",
    width: "100%",
  },
  title: {
    position: "absolute",
    fontSize: "15px",
    color: "#3F3F3F",
    left: "50%",
    transform: "translateX(-50%)",
  },
  icon: {
    height: "48px",
    position: "absolute",
    top: '15px',
    right: "15px",
  },
  close: {
    position: "absolute",
    right: "5px",
  },
};

const Header = () => (
  
  <div style={styles.header}>
    <span style={styles.title}>Mupixa Publisher</span>
    <img style={styles.icon} src={icon} />
  </div>
);

const ModalFrame = (props) => {
  return (
    <div style={{ width: 'auto', height: 260 }}>
      <Header />
      {props.children}
    </div>
  );
};

export default ModalFrame;
