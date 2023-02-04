# Designing Card Templates

The templates file (or JSON object delivered to the client in response to the "cards" request) contains a key "cards"
that has an array of card templates as value.

A card template is a JSON object with the following properties:

* `id`: this is the key by which a template can be unambiguously referenced
* `appliesTo` is the type of object the template can visualize. These types are defined in the data dictionary (see `Data_model.md`)
* `name` is the name of the view this template represents. For each object type, multiple views can be specified
* `aggregate` has a boolean value `true` or `false`. If `true`, the template visualizes a set of graph nodes instead of a single node
* `size`: an object containing the properties `w` and `h` to describe the native (unscaled) size of the card in pixels
* `clickable` boolean. It defines whether this card can be clicked and thus become the focus card or whether it is only 
used as a layout element in other cards.
* `detailTemplate` is the id of another (more detailed) template that can be used as focus (or hover) card when the user
  clicks on the card. This allows the realization of semantic zoom.
* `detailNode` can be used in conjunction with `detailTemplate` to navigate to a view that renders not a graph node, but
  a synthetic node. See more under [Synthetic Nodes](#synthetic-nodes)
* `background` The background can have two values for `type`:  `rect` or `image`
* `colorcoding` optional. Describes how the background color is derived from attribute values of the data node
* `elements` An array of JSON objects defining the inner layout. Each element must have a `key` and `type` attribute, as well as `x`, `y`, `w` and `h` to define position and size. Other attributes depend on the element type.

There are currently the following types of elements:
* `textfield` a text element that binds directly to the specified `attribute` of the data node
* `caption` caption can mix predefined text and data attributes. The attribute names are enclosed in handlebars `{{` and `}}`
* `box` a (optionally rounded) rectangle
* `image` an image
* `link` a hyperlink
* `chart` currently only four `chartType` values are supported: `rect`, `stackedBar`, `graph` and `polar`
* `trellis` will group nodes in a node set by a specified attribute and create a set of cards representing each subset respectively.
* `card` displays an aggregation of associated nodes in a single nested card
* `cards` displays associated nodes as a set of cards which are arranged in a raster

Here is an example from the development server:
```    {
      "id": "ticket-compact",
      "name": "Compact",
      "appliesTo": "jira:ticket",
      "aggregate": false,
      "size": { "w": 220, "h": 120},
      "background": { "type": "rect", "w": 220, "h": 120, "cornerRadius": 6},
      "clickable": true,
      "colorcoding": {
        "type": "selection",
        "attribute": "jira:status",
        "cases": {
          "$": "COLOR_BY_STATUS"
        },
        "default": {
          "$": "DEFAULT_TICKET_COLOR"
        }
      },
      "elements": [
        {
          "key": "heading-large",
          "type": "textfield",
          "x": 10, "y": 35, "w": 200, "h": 50,
          "attribute": "uri",
          "style": {"font-weight": "bold", "color": "white", "font-size": "30px", "h-align": "center"}
        }
      ]
    },
```

## Data Paths
Most card elements visualize data associated with nodes. This data is identified for example by the `attribute` parameter,
by the `source` parameter in the `chart`, `card`, `cards` and `trellis` elements and inside handlebars `{{<path>}}` 
in the caption's `text` or the link's `url` parameter. Such data can be directly associated with a node, in which case
the reference simply consists of the name of the attribute or association. When an associated node is used as reference
for a text element (caption or textfield), the display name of that node is automatically used.

If data of associated nodes is used in a card, the reference is a path, which is a segment of path segments separated by
slashes (`/`). Each segment is the name of an association with an optional target type filter (or an attribute in the
case of the last segment). A target type filter has the form `[<node type>]` and is appended to the association name.
It will traverse only associations of the specified name that point to nodes of the specified node type. For example,
a path `dcc:dependsOn[jira:story]/jira:team` will return only the teams working on _stories_ that the focus node depends
on, but not teams working on bugs that may be associated with that focus node. If a type hierarchy is established in
the dictionary, specifying a supertype in the type filter will automatically include all sub-types.

Data paths can be also used in conditions and color coders.

## Synthetic Nodes
In order to render views that don't represent plain graph nodes but composite data, synthetic nodes can be created.
Synthetic nodes need to have a type that is declared in the dictionary, and they may have a uri (if no uri is specified,
the uri will be set to `core:blank-node` and the node will not be registered in the cache). The way to create a synthetic
node is to declare it as `detailNode` in a clickable template. When the template is clicked, the synthetic node will
be used instead of the original graph node for the detail card that becomes the focus (or hover card). The base parameters
are:
* `type`
* `method` - either `map`, to create it from data related to the current node or `retrieve` to retrieve it from the server
* `uri` - an uri should always be specified if the `retrieve` method is used or the mapping contains long paths. It will 
cause the node to be cached so it is available if needed again. Handlebars `{{...}}` containing data paths can be used to 
  to dynamically generate a uri. 
  
### Mapped Synthetic Nodes
If the method is `map`, an additional parameter `mapping` must be provided. It is a key-value object, where the keys
specify the properties of the synthetic node and the values are data paths relative to the current node.

### Retrieved Synthetic Nodes
For the method `retrieve`, the additional parameter `request` is required. It is a string that can contain handlebar
expressions `{{...}}` containing data paths. The url will be called to retrieve a full subgraph and the synthetic node
serves as entry point and identifier of this subgraph (ensuring that the same subgraph doesn't need to be retrieved
more than once). Consequently, the expected response has to match that of the `api/graph` call, but in addition to the
`data` array of graph nodes, it will also contain a property `entryPoint` which is the synthetic node and can point to 
nodes in the subgraph via associations (the association types, too, must be known in the dictionary).

## Element parameters

### All elements:
* `key` an identifier that must be unique in the scope of the parent element
* `x`, `y`, `w`, `h` x and y position, width and height of the element (in the parent element's coordinate system)
* `condition`: An optional condition that prevents the element from being rendered if the condition fails. 
The form of the condition is `{"<attribute>": "<comparator><comparand>"}`. For available comparators see inputSelector
  in [chart](#chart)

### textfield
* `attribute` the attribute of the card node to be displayed. The attribute can be a direct attribute of the current
  node of a path expression using `/` as separators to traverse to an attribute of an associated element. For example,
  you could use an expression `jira:team/dcc:speed` to include the speed (story points per sprint) of the associated team
  in a ticket. If the evaluation of the path results in a graph node instead of a primitive (e.g. `jira:team`), the 
  node's display name will be used as attribute value. If no name attribute is present, the uri of the node is used.
* `style` an object that corresponds to a css style, supporting these attributes
  * `color`
  * `background-color`
  * `border-radius`
  * `font-weight`
  * `font-size`
  * `padding`
  * `z-index`
  * `font-family`
  In addition, these non-css style attributes are supported:
  * `h-align` (`left`, `center` or `right`)
  * `v-align` (`top`, `center` or `bottom`)

### caption
Caption is the same as a text field, but instead of `attribute`, it has a `text` attribute, which is a text literal
which can embed node attribute values with handlebar syntax, e.g. `Node {{core:name}}`. As in [textfield](#textfield), 
a path expression can be used inside the handlebars.

### box
The box is the same as a text field without any text. It's appearance is controlled by the style attributes

### image
  * `source` URL of the image source
  * `color` (optional) background color behind the image
  * `style` as in textfield

### link
  * `url` a string that can include attributes in handlebars like `caption`
  * `text` Link text
  * `style` as in textfield
  * `modal` - optional, if true, the link content is shown as modal iframe in the DCC window
  * `modalWidth`, `modalHeight` - optional, size in pixels for the modal.

When specifying a link target as modal, make sure that the targeted site allows rendering inside an iframe, otherwise
the content will not show in the modal window.

### chart
  * `chartType` (`rect`, `stackedBar`, `graph` or `polar`)
  * `source` node attribute containing the data for the chart
  * `inputSelector` `{"<attribute>": "<comparator><comparand>"}`
    where `<comparator>` is one of `=`, `!=`, `<`, `<=`, `>`,`>=`, `empty`, `exists`, `contains`, `!contains`, `->`
    The input selector filters the data from `source` before it is fed into the chart
    Comparands can use the same handlebar notation as [caption](#caption) to use attributes associated to the current node.
  * `overlay` a set of contextual nodes (calculated in preprocess methods) that amend the nodes fed into the chart by
    calculated attributes or associations - arcane

For chart type `rect`, a single bar proportional to an attribute value is rendered:
  * `maxValue` specifies the largest possible attribute value 
  * `maxW` specifies the width of the bar for the largest possible attribute value
  * `h` the height of the bar
  * `color`
  * `attribute` the node attribute to evaluate

For chart type `stackedBar`:
  * `totalWidthValue` either a number or the name of an attribute that specifies the attribute value corresponding with the total width of the stacked bar
  * `widthAttribute` the attribute to evaluate for the width of each node's bar
  * `h` the height of the stacked bar
  * `colorAttribute` the attribute used to choose the color for each node's bar
  * `colors`: an array of objects of the form `{"condition": "<comparator><comparand>","color": "<color>"},
  * `sortSequence` (`asc`, `desc`, `byUri`) if `asc` or `desc`, the nodes are sorted by the attribute specified in `colorAttribute`

For chart type `graph`:
  * `path` a path expression used to traverse from one graph node to the next
    can contain multiple associations separated by `/`. A `*` at the end of a path segment means that this
    association is evaluated recursively
  * `bounded` (`true` or `false`) If `true` only nodes that were in the chart source (before the inputselector is applied)
    are rendered in the graph
  * `nodeAspectRatio` width to height ration of the graph nodes
  * `viewName` name of the template view to be selected for each graph node
  * `canvasW` and `canvasH` are the width and height of the zoomable canvas on which the graph will be drawn, if omitted, they will be set to the w and h of the chart itself
  * `minScale` and `maxScale` are the boundaries for the scaling of the graph canvas when the user zooms
  * `swimLanes` is the name of a property that will be used to group the graph nodes into swim lanes

For chart type `polar`:
  * `dimensions` an array of attribute names
  * `maxValues` an object assigning a maximal value for each of the dimensions
  * `labels` an array of Label texts for the dimensions
  * `labelStyle` same as `style` in `textfield`
  * `diameter`
  * `colorStops` an array of objects of the form `{"percent": "<number>", "color":  "<color>"}`

### cards
Displays individual cards for each associated node of the specified association in a grid
  * `source` the association type to evaluate
  * `arrangement` an object with the following attributes:
    * `type` currently only `grid` is supported
    * `padding` fraction of card size left free between cards, e.g. 0.1 for 10%
    * `maxScale` if specified prevents children from being scaled up beyond this factor even if more space is available
    * `centerX`, `centerY` if set to `true` the cards grid is centered in the available space
  * `inputSelector` as in chart
  * `align` Object with property names as keys and an aggregation type (min, max, avg) as values. The specified properties
    will be uniformly set to the value (min, max, avg) of that same property aggregated over all nodes 
  * `template` (optional) id of the template to use for the card layout - if left out will be determined by node type 
  * `viewName` if `template` is not specified, specifies which of the applicable templates for the node type is chosen
  * `options` a key-value object that preselects view options of the applied template

### card
Similar to `cards`, but displays one card for the totality of the associated nodes. The template that is used
must have `aggregate: true`. The `template` must be specified, `viewName` is not applicable.
Also `align` is not applicable.
`name` can be specified and will be written into the `core:name` attribute of the contextual node.

### trellis
Trellis is similar to `cards`, but these cards are created by grouping the input nodes by the specified `groupattribute`
and creating one aggregated card for each group.
* `source`, `template`, `arrangement`, `inputSelector`, `align` as in the "cards" element.
* `groupAttribute` the name of the attribute to use for grouping

## Color coding

The `colorcoding` attribute of a template specifies the color of the card background depending on an attribute value

* `type` (`selection` or `gradient`) for discrete colors or a continuous range of colors
* `attribute` the attribute to be evaluated for the color coding
* `cases` only applicable for `selection`, it is the same as `colors` in the stacked bar chart:
    an array of objects of the form `{"condition": "<comparator><comparand>","color": "<color>"},
* `default` the color to choose if the color attribute is missing
* `markers` only applicable for `gradient`: An array of objects with tke keys `value` and `color`, same as in polar chart

## Contextual Nodes 

All the cards (both representing single nodes or node sets) actually do not bind to the data itself but to a proxy node that
only lives in the context of the respective card. This node can be amended with additional properties without changing the
original node - even overwriting properties is possible (more about that in **Preprocessing**)
One property that every contextual node has is `core:context`, an object that is passed down to the contextual nodes of
all child cards and can be used to align things across these.


## Aggregate Card Templates

For an aggregate card, the contextual node is not a proxy for a single node but rather represents the aggregate node
of the the whole node set. By default, it has the properties `core:subNodes` which contains the set of individual nodes the card represents
and `core:nodeCount` which indicates the number of nodes in that set. It will also have a `core:name` attribute if `name`
was specified in the `card` element of the parent template. The `core:name` attribute is automatically set by a `trellis`
element for each subgroup.

## Preprocessing
Both single node and aggregate templates can specify certain preprocessing steps to be applied to the node set before rendering:
All results of preprocessing are written into the contextual card node, and each preprocessing step can read the attributes
written by previous steps.

`preprocess`: An array of preprocessing directives
Each directive is an object which usually has the following parameters:
* `set` name of the attribute of the (contextual) card node in which the result is stored.
  for the functions `aggregate` and `create-node`, set is an object where the keys specify the attributes to set
* `source`: the property (or data path) of the card node to evaluate
  source is an array for the functions `unify`, `intersect`, `subtract`, and `first-found`, and
  is not required for the function `create-node`. If requirend, but not specified, `source` defaults to
  `core:subNodes`.
* `inputSelector`: a filter as described in the chart and cards elements, which will be applied to the evaluated `source`
  Does not apply if `source` is an array and for the functions `create-node`  
* `function`: (`aggregate`, `set-context`, `path-analysis`, `derive-associations`, `create-node`, `unify`, `intersect`,
  `subtract` or `first-found`)

In general the source is evaluated, filtered by the inputSelector (if specified and applicable), transformed through
the function (if specified) and stored in the property specified by `set` or `set-context`.

In the simplest form, a preprocessing is just setting an attribute of the card node to some data path expression:
```
{"set": "teamBugs", "source": "team/dcc:bugs"}
```

Alternatively to `set`, the key `set-context` can be used. Values set with `set-context` are not only visible
to the card itself but also to all child cards (using the `core:context/` prefix).

The following preprocessing functions are supported:
* `aggregate`: runs simple aggregations over the source nodes (after applying the input selector
  if this function is used, `set` is an object of the following form: 
  `{<key of result>: {attribute: <attribute name>, calculate: <aggregation>}}`
  where `<aggregation>` is one of `min`, `max`, `sum`, `avg`, `count`
  Hence, the aggregate function writes multiple properties at once. 

Example:
```
{"function":  "aggregate", "set": {"storyPointSum":  {"attribute":  "jira:storypoints", "calculate":  "sum"}} }
```

* `derive-associations`: creates new associations (shortcuts) between the nodes of the set
Its parameters are: 
  `path`: the association path to evaluate. Segments are separated by `/`
  `derived`: the name (or rather uri) of the derived association type
  `recursive`: true or false, determines whether the process should be repeated for all nodes reached by the path
  
  Keep in mind that only nodes for which the (full) specified path has been found (and a shortcut added) are stored in the
  property specified in `set`. Therefore, the use of `derive-association` should in most cases be combined with using
  the `result` as `overlay` to amend a set of nodes and not as self-contained input into a visualization.
  
* `path-analysis`: recursively traverses a specified association for all sets of the input set (after inputSelector applied)
and for each touched node stores aggregated values over all predecessors (upstream) and over all successors (downstream)
Its parameters are:
  `associationType` - the type of the association to traverse
  `upstreamAggregate` and `downstreamAggregate`, both conforming to the `aggregate` descriptor described above
  The function writes an aggregated node representing all touched (and amended) nodes into the property specified by
  `set`. That node can be used as `overlay`.
  
`derive-associations` and `path-analysis` don't modify the original nodes, they create contextual nodes which only live
in the specified `result` property of the card set's contextual node.
The amended nodes of a result can be used in a chart instead of the original nodes of a set if the result is specified as
the `overlay` parameter of that chart. The framework will replace each node with the contextual node with the matching URI
before rendering the chart.

* `create-node` Creates a synthetic node and stores it in the property specified by `set` (or `set-context`). Additional
  parameters that need to be specified are `type`, (the URI of the type for the synthetic node) and `mapping` which is an
  object, the keys of which are properties of the synthetic node and the corresponding values are data paths.

* `unify`, `intersect`, and `subtract` have an array of properties (no data paths allowed) pointing to nodes as source and 
  perform the respective set operations. If more than two sets are specified in `source`, the function `subtract` will
  subtract all subsequent sets from the first set.

* `first-found` also has an array as `source`, here data paths are allowed. The value written into the property specified
  by `set` is the result of first path in the array that yields a result. The function is used to get "fallback" values
  in case a property is not present.
  
### set-context vs. set
* if `set-context` is used, the result of the source/filter/function chain is written into the `core:context` object that
  is passed down to child cards
* if both `set` and `set-context` are used, the results are written to both the card node and the context node. 

Example:
```
{"set-context":  "allNodes", "source": "core:subNodes"}
```

### Logging in Preprocessing
For troubleshooting, it is useful to get logs describing the intermediate results of all preprocessing steps.
Therefore, it is possible to specify a `log` object in the template.
The `log` object has two keys:
* `logLevel`: One of `results` and `paths`. If `results` is specified, only the results of the preprocessing steps are
  logged to the console. If `paths` is specified, all intermediate steps during the evaluation of a data path are logged.
* `condition`: If specified, the logging is only activate if the card node matches the specified condition. The syntax is
  the same as for filters and color coders.

## View Options

Card templates can have view options - user-selectable parameters influencing how they are rendered.
The property `options` is an object in which each key is the name of such a parameter and the value describes the choices
the user has for this parameter. For example:

```      "options":  {
        "grouping": {
          "caption": "Group by",
          "display": "radio-buttons",
          "selection": [
            {"label":  "Feature", "value": "jira:feature"}, {"label": "Team", "value": "jira:team"},
            {"label":  "Status", "value": "jira:status"}, {"label": "Release", "value": "jira:release"}],
          "defaultValue": "jira:team"
        }
      },
```
* `caption` is the text displayed as the caption of the selections in the lower part of the sidebar when a card with
the parameterized template is in the focus.
* `display` - currently only `radio-buttons` is supported
* `selection` is the array of choices the user has. Each one of these has two properties:
  * `label` is the text of the corresponding button
  * `value` is the actual value that the parameter has when this choice is selected
* `defaultValue` is the value the parameter has in the beginning

The parameter can be used in place of text literals with a preceding `$` character, for example:
```
          "groupAttribute": "$grouping"
```

## Global Constants

In addition to the "cards" key, the templates file also has a key "constants", with an array of constant declarations as
value. Constants are reusable (partial) objects which help avoid repetitions of styles or element declarations.
Each constant is an object with a single key (the constant name) and an arbitrary value:
``` 
   {"TEXT_COLOR": "rgba(0,0,0,0.7)"},
```

A preprocessor will replace all objects of the form

```{"$": "<constant name>"}``` by whatever value was assigned to that constant (atomic or object).

If the constant is an object, it can be modified or extended whenever it is used by specifying further keys in addition 
to `$`.

Constants can even use constants that have been defined further up in the array:

```
    {"CARD_HEADING_STYLE": {
        "font-family": "Arial, sans serif",
        "color": {
          "$": "HEADING_COLOR"
        },
        "font-weight": "600",
        "font-size": "24px",
        "text-transformation": "uppercase"
      }},
    {"GROUP_HEADING_STYLE": {
        "$": "CARD_HEADING_STYLE",
        "font-size": "18px"
      }},
```

The constant `GROUP_HEADING_STYLE` inherits all properties of `CARD_HEADING_STYLE` and only overrides `font-size`.

