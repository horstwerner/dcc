# Developing with the Development Server

In order to simplify development, the project comes with a tiny backend that serves configuration, card templates, and data.
After cloning the project, the development server will retrieve all this information from the `testData` folder. To adapt
the server for your own purposes, create a `data` directory in the `dev-backend` directory and populate it with the following
files:
* `config.json`
* a data dictionary file, e.g. `dictionary.json`
* a card template file, e.g. `templates.json`
* a tool template file, e.g. `tools.json`
* one or more datafiles with `.csv` or `.json` extensions

The server will look for a file `data/config.json` when starting up and fall back to `testData/config.json` if it doesn't
find that file.

The default `config.json` file looks like this:

```
{
  "dictionaryFile": "testData/dictionary.json",
  "templateFile": "testData/templates.json",
  "toolFile": "testData/tools.json",
  "dataFiles": ["testData/jira.csv", "testData/teams.csv"],
  "clientConfig": {"getGraph": false, "getTables":  ["jira:ticket", "jira:team"], "startTemplate":  "root"}
}
```

the `clientConfig` property is what the client receives when it calls the `/api/config` end point.
The other properties specify the locations of the files mentioned above. The paths of these files should begin with `data/`

The client can retrieve data from the backend in two forms: As a graph of nodes represented by individual json objects,
which is useful for data that is already in a graph form, or as tables, derived from csv files, which is more compact
and hence better suited for large amounts of nodes.

Both the "graph" data (if provided) and the "table" data will be merged into a single graph in the client.
The client config specifies what data the client requests from the backend. If the property `getGraph` is set to `true`,
the client will send a request to `api/graph`.
If `getTables` is specified, the client will query the `api/data` endpoint for each of the specified object types.

The last property in the config file is `startTemplate`. It specifies the id of the card template used to generate the
start card in the UI.
