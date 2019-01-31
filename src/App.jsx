import React, {Component} from 'react';
import './App.css';
import Cache from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';
import CardSet from "./components/CardSet";

const handleResponse = function (response) {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};

class App extends Component {

  constructor() {
    super();
    this.state = {
      dataLoaded: false,
      error: null,
    }
  }

  componentDidMount() {
    this.getDictionaryFromDb()
        .then(() => Promise.all([...Cache.getEntityTypes().map( type => this.getDataFromDb(type)), this.getCardDescriptorsFromDb()]))
        .then(() => {
            this.setState({dataLoaded: true})})
  };

  getDictionaryFromDb() {
    return fetch('/api/dictionary')
        .then(handleResponse)
        .then(result => {
          Cache.importTypes(result.data)})
        .catch(error => this.setState({error}));
  };

  getCardDescriptorsFromDb() {
    return fetch('/api/cards')
        .then(handleResponse)
        .then(result => {
          result.data.forEach(descriptor => {
            TemplateRegistry.registerTemplate(descriptor)
          })
        })
        .catch(error => this.setState({error}));
  };

  getDataFromDb(type) {
    console.log(`fetching data of type ${type}`);
    return fetch(`/api/data?type=${encodeURI(type)}`, {})
        .then(handleResponse)
        .then(res => {
          Cache.importNodeTable(res.data.type, res.data.headerRow, res.data.valueRows );
        })
        .catch(error => {
          this.setState({ error });
        });
  }

  render() {
    const { dataLoaded, error } = this.state;

    return (
      <div className="App">
          {error && <span>An error occurred: {error.message}<br/></span>}
          {dataLoaded && <CardSet nodes={Cache.getAllNodesOf('jira:ticket')} template={TemplateRegistry.getTemplate('jira:ticket')}/>}
      </div>
    );
  }
}

export default App;
