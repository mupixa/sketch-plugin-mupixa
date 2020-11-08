import React from 'react';
import {eventTypes} from '../constants';
import Login from './Login';
import Loading from './Loading';
import Result from './Result';
import ModalFrame from './ModalFrame';
import { ThemeProvider } from '@material-ui/core/styles';
import theme from './theme';
import Btn from './Btn';
import Publish from './Publish';
import About from './About';
import Footer from './Footer';

const variables = require("./variables.css");

const App = (props) => { 
    const [token, setToken] = React.useState(undefined);
    const [aboutVisible, setAboutVisible] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [processingStep, setProcessingStep] = React.useState(0);
    const [result, setResult] = React.useState('');
    const [projectId, setProjectId] = React.useState('');


    React.useEffect(() => {
      window.addEventListener("send-data", handlePluginData);
      window.addEventListener("click", interceptClick);
      

      // cleanup
      return () => {
        window.removeEventListener("send-data", handlePluginData);
        window.removeEventListener("click", interceptClick);
      };
    });

    const handlePluginData = (e) => {
        if(!(e && e.detail && e.detail.data)) return;

        const data = JSON.parse(e.detail.data);
        switch(data.type) {
          case eventTypes.SET_TOKEN: {
            setToken(data.payload);
            break;
          }
          case eventTypes.RESET_TOKEN: {
            setToken(null);
            break;
          }
          case eventTypes.SET_PROGRESS: {
            setProcessingStep(data.payload);
            break;
          }
          case eventTypes.SET_RESULT: {
            setProjectId(data.payload.projectId);
            setResult(data.payload.result);
            setLoading(false);
            break;
          }
        }
    }

    const interceptClick = (event) => {
      const target = event.target.closest('a')
      if (target) {
        event.preventDefault()
        window.postMessage('openLink', target.href)
      }
    }

    const resetResult = () => {
      setResult('');
      setProjectId('');
    }

    const showAbout = (show) => {
      return () => {
        setAboutVisible(show);
      };
    };

    const authorizeToken = () => {
      window.postMessage('authorizeToken', '');
    };

    const resetToken = () => {
      window.postMessage('resetToken', '');
    };

    const publish = (name) => {
      window.postMessage('publish', name);
      setLoading(true);
    }

    if(result) {
      return (
        <ThemeProvider theme={theme}>
          <ModalFrame>
            <Result result={result} projectId={projectId} resetResult={resetResult}></Result>
          </ModalFrame>
        </ThemeProvider>
      );
    }

    if(loading) {
      return (
        <ThemeProvider theme={theme}>
          <ModalFrame>
            <Loading processingStep={processingStep}></Loading>
          </ModalFrame>
        </ThemeProvider>
      );
    }

    if (aboutVisible) {
      return (
        <ThemeProvider theme={theme}>
          <ModalFrame>
            <About />
            <Footer>
              <Btn onClick={showAbout(false)}>back</Btn>
            </Footer>
          </ModalFrame>
        </ThemeProvider>
      );
    }

    return (

      <ThemeProvider theme={theme}>
          <ModalFrame>
            {!token ? (
              <React.Fragment>
                <Login
                  authorizeToken={authorizeToken}
                />
                <Footer>
                  <Btn onClick={showAbout(true)}>about</Btn>
                </Footer>
              </React.Fragment>
              
            ):
            (
              <React.Fragment>
                <Publish publish={publish} />
                <Footer>
                  <Btn onClick={resetToken}>reset token</Btn>
                  <Btn onClick={showAbout(true)}>about</Btn>
                </Footer>
              </React.Fragment>
            
            )}
          </ModalFrame>
      </ThemeProvider>
    );
}

export default App;