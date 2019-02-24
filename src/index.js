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

