import App from './App';

window.onload = () => {
  const root = document.getElementById('root');
  const app = new App({title:"Hallo Welt"}, root);
  console.log('onload executed');
  document.body.style.overflow = 'hidden';
  document.body.onresize = () => {
    app.onResize(window.innerWidth, window.innerHeight);
  };
};
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.unregister();
