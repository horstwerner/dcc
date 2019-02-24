import P from 'prop-types';
import Component from './symb/Component';
import css from './App.css';
import {Table_, Row_, Header_, Cell_} from "@symb/Table";

export default class App extends Component {

  static propTypes = {
    title: P.string
  };

  update(props) {
    const { title } = props;
    this.createChildren(
        Table_({key: 't1'},[
          Row_({key: 'r1'}, [
              Header_({key: 'h1'}, 'Person')._Header,
              Header_({key: 'h2'}, 'Task')._Header,
              Header_({key: 'h3'}, 'Due Date')._Header
            ])._Row,
          Row_({key: 'r2'}, [
                Cell_({key: 'h1'}, 'Hugo')._Cell,
                Cell_({key: 'h2'}, 'Kehren')._Cell,
                Cell_({key: 'h3'}, 'Gestern')._Cell
            ])._Row]
        )._Table
    );
    console.log(css);
    this.dom.className = css.app;
  }

};