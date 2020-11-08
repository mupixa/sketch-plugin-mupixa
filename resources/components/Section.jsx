import React from 'react';
import propTypes from 'prop-types';

const Section = (props) => {
  return (
    <div
      style={{
        width: "100%",
        marginTop: props.margin,
        marginBottom: props.margin,
        display: "block",
        textAlign: props.align,
      }}
    >
      {props.children}
    </div>
  );
};

// Section.propTypes = {
//   children: PropTypes.any.isRequired,
//   align: PropTypes.string.isRequired,
//   margin: PropTypes.string.isRequired,
// };

Section.defaultProps = {
  align: "left",
  margin: "15px",
};

export default Section;
