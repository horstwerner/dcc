import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const root = document.getElementById('root');
let app;

ReactDOM.render(<App ref={(element) => app = element}/>, root);
document.body.onresize = () => {
  console.log(`resized root`);
  app.onResize(window.innerWidth, window.innerHeight);
};

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
