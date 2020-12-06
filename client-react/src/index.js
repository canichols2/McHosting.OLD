import React from 'react';
import ReactDOM from 'react-dom';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import App from './App';

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#66BB6A',
      main: '#64CC57',
      dark: '#43A047',
      contrastText: '#fff',
    },
    secondary: {
      light: '#8d6e63',
      main: '#795548',
      dark: '#5d4037',
      contrastText: '#000',
    },
  },
});


ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
