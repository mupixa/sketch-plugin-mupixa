const React = require("react");
const PropTypes = require("prop-types");
const style = require("./Btn.css");

const Btn = (props) => {
  return (
    <div className={"Btn"} onClick={props.onClick}>
      {props.children}
    </div>
  );
};

Btn.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.any.isRequired,
};

module.exports = Btn;