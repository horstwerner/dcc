import { App_ } from './App';
import Factory from '@symb/ComponentFactory';

window.onload = () => {
  const root = document.getElementById('root');
  const app = Factory.create(App_({key:"root", title:"Hallo Welt"})._App, root);
  console.log('onload executed');
  document.body.style.overflow = 'hidden';
  document.body.onresize = () => {
    app.onResize(window.innerWidth, window.innerHeight);
  };
};

