import { App_ } from './App';
import Factory from '@symb/ComponentFactory';

window.onload = () => {
  const root = document.getElementById('root');
  const app = Factory.create(App_({key:"root", title:"Development Control Center"})._App, null, root);
  document.body.style.overflow = 'hidden';
  let pendingResize = null;
  document.body.onresize = () => {
    if (pendingResize) {
      clearTimeout(pendingResize);
    }

    pendingResize = setTimeout( ()=> {app.onResize(window.innerWidth, window.innerHeight); pendingResize = null}, 20);
  };
};

