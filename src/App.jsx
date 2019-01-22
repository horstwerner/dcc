import React, { Component } from 'react';
import './App.css';
import Cache from './graph/Cache';

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
        .then(() => Promise.all(Cache.getEntityTypes().map( type => this.getDataFromDb(type))))
        .then(() => {
            this.setState({dataLoaded: true})})
  };

  getDictionaryFromDb() {
    return fetch('/api/getDictionary')
        .then(handleResponse)
        .then(result => {
          Cache.importTypes(result.data)})
        .catch(error => this.setState({error}));
  };

  getDataFromDb(type) {
    return fetch(`/api/getData?type=${encodeURI(type)}`, {})
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
        <header className="App-header">
          {error && <span>An error occurred: {error.message}<br/></span>}
          {dataLoaded && Cache.mapAllNodesOf('dcc:test', node => node['jira:ticket'].displayName()).join(',')}
        </header>
      </div>
    );
  }
}

export default App;
