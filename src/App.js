import P from 'prop-types';
import Component from '@symb/Component';
import {CardSet_} from "./components/CardSet";
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import omit from 'lodash/omit';
import Cache from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {NavigationMap_} from "@/components/NavigationMap";
import {fit} from "@symb/util";
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
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      focusMap: null,
      trsnsitions: []
    };

    this.getDictionaryFromDb()
        .then(() => Promise.all([...Cache.getEntityTypes().map(type => this.getDataFromDb(type)), this.getCardDescriptorsFromDb(), this.getNavigationFromDb()]))
        .then(() => {
          if (!this.state.error) {
            this.setState({
              dataLoaded: true,
              currentMap: TemplateRegistry.getStartMap()
            })
          }
        });
    this.onElementClick = this.onElementClick.bind(this);

  }

  onElementClick(e, element) {
    debugger
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
    const {width, height, currentMap} = this.state;

    this.createChildren([
      error && Div_({}, `An error occurred: ${error.message}`)._Div,

      dataLoaded && NavigationMap_({
          key: 'navigation',
          spatial: fit(windowWidth, windowHeight, currentMap.width, currentMap.height),
          dataSource: Cache,
          onElementClick: this.onElementClick,
          ...currentMap
        })._NavigationMap
    ]);
  }

  onResize(width, height) {
    this.setState({windowWidth: width, windowHeight: height});
  }

  // mapActorFocused(key, map) {
  //   const {width, height} = this.state;
  //   const scale = Math.min(width / map.width, height / map.height);
  //   const xOffset = Math.floor((width - scale * map.width) / 2);
  //   const yOffset = Math.floor((height - scale * map.height) / 2);
  //
  //   return new Actor({
  //     key,
  //     x: xOffset,
  //     y: yOffset,
  //     scale,
  //     node: (<NavigationMap {...map} dataSource={Cache} onElementClick={(key, description) => {
  //     this.createTransition(key, description);
  //   }}/>)
  // });
  // };

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
