# Development Control Center (DCC)

The DCC is a configurable, metadata-driven tool designed for the tracking and analysis of project data in complex
development projects.

Every software development organization needs to track work packages and bugs (often by means of Jira or similar
applications), but also other project related information such as test cases, planned features and releases etc.

The Development Control Center will provide a unified view and analysis capabilities across all these different types
of records and across different repositories. It does that by integrating different data sets into a client-side graph
cache.

### Separation of Client and Domain Model

Since the types of data (stories, bugs...) and particular angles of view are slightly different in each organization,
the DCC client itself contains no hard-coded domain model whatsoever. All the information it needs to render and process
the data is supplied by the backend. While this project contains a small backend server for development purposes, this
server is not meant for productive use. Instead, an organization-specific backend is recommended, which connects to the
APIs of the respective tools (e.g. Jira) and delivers the extracted data to the DCC client in the required form.

The development server is just a reference implementation of the API. The backend server should provide both the html
file and the api endpoints, in order to avoid CORS problems. Upon load, the client will send a GET request to the end point
`api/config` in order receive the low-level client configuration, which tells it which data to request and what to render
on the start screen.

In a second call, it will call the end point `/api/dictionary` in order to receive the type dictionary, which encodes
the domain model and vocabulary to use. After this, further calls to `/api/cards` and `/api/tools` will retrieve the
rendering and filter metadata respectively. Finally calls to the end points `/api/graph` and/or `/api/data` will retrieve
the data itself.

This means that adapting the DCC to a particular organization's needs doesn't require touching the client code at all.
As a consequence, the code bases and hence the lifecycles of the generic frontend maintained in this OSS project and of
company-specific data models and user interfaces are fully decoupled.

### Building Tools with the DCC

The User Interface of the DCC consists mainly of cards, which represent single entities or sets of entities and can be
designed in a wide variety of ways. The data itself is internally represented by a graph consisting of Javascript objects.
Cards are created by binding these graph nodes to soft-coded templates. The templates define the position and size of
atomic or composite layout elements, and what properties of a graph node are used to populate the layout elements with
data.

Because cards can be nested, this approach allows the creation sophisticated visualizations.

### Using the DCC

The DCC consists of four areas: the large focus area in the middle of the screen, which is used to view and interact with
a card or card set; the sidebar at the right, which allows the selection of alternative views, filter tools and view settings;
the filter bar at the bottom, in which the user can interact with the selected filter tools; and the breadcrumb bar at the
top which keeps track of all cards the user has interacted with.

Using the DCC is very simple: There is no top-level navigation and there are no menu structures. The whole navigation is
simply carried out by clicking on cards and switching views. At the beginning, a start card is rendered in the focus area.
Clicking on a nested card will magnify it to its full size and show it hovering over the focus card. The user can then either
click on the hovering card to make it the focus card or send it to the breadcrumb lane for later use.

Clicking on a card in the breadcrumb lane will make it the focus card. Whenever the current focus card is replaced by
another card, it will move into the breadcrumb lane so that the user can come back to it later if desired.

More detailed information is found in the `documentation` folder.
