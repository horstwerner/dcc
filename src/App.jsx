import React, { Component } from 'react';
import './App.css';

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
      data: "Sorry no data",
      error: null,
    }
  }

  componentDidMount() {
    this.getDataFromDb();
  }

  getDataFromDb() {
    fetch('/api/getData')
        .then(handleResponse)
        .then(res => this.setState({data: res.data}))
        .catch(error => {
          this.setState({ error });
        })
    ;
  }

  render() {
    const { data, error } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          {error && <span>An error occurred: {error.message}<br/></span>}
          {data}
        </header>
      </div>
    );
  }
}

export default App;
