import P from 'prop-types';
import Component from '@symb/Component';
import {CardSet_} from "./components/CardSet";
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import omit from 'lodash/omit';
import Cache from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';

const APP = 'app';

const handleResponse = function (response) {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};

export default class App extends Component {

  static type = APP;
  static className = css.app;

  static propTypes = {
    title: P.string
  };

  constructor(props, domNode) {
    super(props, domNode);
    this.state = {
      dataLoaded: false,
      error: null,
      width: window.innerWidth,
      height: window.innerHeight,
      focusMap: null,
      trsnsitions: []
    };
    this.getDictionaryFromDb()
        .then(() => Promise.all([...Cache.getEntityTypes().map(type => this.getDataFromDb(type)), this.getCardDescriptorsFromDb(), this.getNavigationFromDb()]))
        .then(() => {
          this.setState({
            dataLoaded: true,
            actors: [
              this.mapActorFocused('root', TemplateRegistry.getStartMap())
            ],
            focusActorKey: 'root'
          })
        });
    // this.navigateTo = this.navigateTo.bind(this);
  }

  getDictionaryFromDb() {
    return fetch('/api/dictionary')
        .then(handleResponse)
        .then(result => {
          Cache.importTypes(result.data)})
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  };

  getCardDescriptorsFromDb() {
    return fetch('/api/cards')
        .then(handleResponse)
        .then(result => {
          result.data.forEach(descriptor => {
            TemplateRegistry.registerTemplate(descriptor);
          })
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  };

  getNavigationFromDb() {
    return fetch('/api/navigation')
        .then(handleResponse)
        .then(result => {
          if (result && result.data) {
            TemplateRegistry.registerNavigationMaps(result.data.maps);
            TemplateRegistry.setStartMap(result.data.startmap);
          }
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  }

  getDataFromDb(type) {
    return fetch(`/api/data?type=${encodeURI(type)}`, {})
        .then(handleResponse)
        .then(res => {
          if (res.data) {
            Cache.importNodeTable(res.data.type, res.data.headerRow, res.data.valueRows);
          }
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({ error });
        });
  }


  updateContents(props) {
    const {dataLoaded, error, focusMap, windowWidth, windowHeight} = this.state;
    // const backgroundColor = (map && map.backColor) || '#ffffff';
    const {width, height, transitions} = this.state;
    // once renderer, transitions are spent - don't rerender because of state change
    this.state = omit(this.state, transitions);

    this.createChildren([
      error && Div_({}, `An error occurred: ${error.message}`)._Div,

      dataLoaded && CardSet_({
        nodes: Cache.getAllNodesOf('jira:ticket'),
        template: TemplateRegistry.getTemplate('jira:ticket'),
        width: windowWidth,
        height: windowHeight
      })._CardSet
    ]);
  }

  mapActorFocused(key, map) {
    const {width, height} = this.state;
    const scale = Math.min(width / map.width, height / map.height);
    const xOffset = Math.floor((width - scale * map.width) / 2);
    const yOffset = Math.floor((height - scale * map.height) / 2);

    return new Actor({
      key,
      x: xOffset,
      y: yOffset,
      scale,
      node: (<NavigationMap {...map} dataSource={Cache} onElementClick={(key, description) => {
      this.createTransition(key, description);
    }}/>)
  });
  };

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
