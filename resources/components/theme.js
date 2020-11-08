import { createMuiTheme } from '@material-ui/core/styles';
import purple from '@material-ui/core/colors/purple';
import red from '@material-ui/core/colors/red'
import green from '@material-ui/core/colors/green';

const theme = createMuiTheme({
  typography: {
    fontFamily: "Arial",
  },
  palette: {
    primary: {
      main: '#6A52FC'
    },
    secondary: {
      main: '#01F197'
    },
  },
  spacing: 4
});

export default theme;