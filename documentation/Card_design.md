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
      "background": { "type": "rect", "w": 220, "h": 120, "cornerRadius": "6px"},
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

## Element parameters

### All elements:
* `key` an identifier that must be unique in the scope of the parent element
* `x`, `y`, `w`, `h` x and y position, width and height of the element (in the parent element's coordinate system)

### textfield
* `attribute` the attribute of the card node to be displayed
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
which can embed node attribute values with handlebar syntax, e.g. `Node {{core:name}}`

### box
The box is the same as a text field without any text. It's appearance is controlled by the style attributes

### image
  * `source` URL of the image source
  * `color` (optional) background color behind the image
  * `style` as in textfield

### link
  * `urlAttribute` node attribute containing the link target
  * `text` Link text
  * `style` as in textfield

### chart
  * `chartType` (`rect`, `stackedBar`, `graph` or `polar`)
  * `source` node attribute containing the data for the chart
  * `inputSelector` `{"<attribute>": "<comparator><comparand>"}`
    where `<comparator>` is one of `=`, `!=`, `<`, `<=`, `>`,`>=`, `empty`, `exists`, `contains`, `!contains`, `->`
    The input selector filters the data from `source` before it is fed into the chart
  * `overlay` a set of contextual nodes that amend the nodes fed into the chart by calculated attributes - arcane

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
  * `template` (optional) id of the template to use for the card layout - if left out will be determined by node type 
  * `viewName` if `template` is not specified, specifies which of the applicable templates for the node type is chosen
  * `options` a key-value object that preselects view options of the applied template

### card
Similar to `cards`, but displays one card for the totality of the associated nodes. The template that is used
must have `aggregate: true`. The `template` must be specified, `viewName` is not applicable.
`name` can be specified 

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
Each directive is an object with the following parameters:
* `input`: the property (association type) of the card node to evaluate
* `inputSelector`: a filter as described in the chart and cards elements
* `method`: (`aggregate`, `set-context`, `path-analysis`, `derive-associations`)
* `result` name of the attribute of the (contextual) card node in which the result is stored

The following preprocessing methods are supported:
* `aggregate`: runs simple aggregations over the selected sub nodes (after applying the input selector
It has one parameter: `results` which is an array of objects of this form:
  `{<key of result>: {attribute: <attribute name>, calculate: <aggregation>}}`
  where `<aggregation>` is one of `min`, `max`, `sum`, `avg`, `count`
  
Example:
```
{"method":  "aggregate", "results": {"storyPointSum":  {"attribute":  "jira:storypoints", "calculate":  "sum"}} }
```

* `set-context`: copies attribute values into the `core:context` object that is passed down to child cards
It has one parameter: `values` which is an object where the keys are the properties of `core:context` to be set and the 
  values are attribute names (or paths) from the current [contextual] card node

Example:
```
{"method":  "set-context", "values":  {"allNodes": "core:subNodes"}}
```
* `derive-associations`: creates new associations (shortcuts) between the nodes of the set
Its parameters are: 
  `path`: the association path to evaluate. Segments are separated by `/`
  `derived`: the name (or rather uri) of the derived association type
  `recursive`: true or false, determines whether the process should be repeated for all nodes reached by the path
  
* `path-analysis`: recursively traverses a specified association for all sets of the input set (after inputSelector applied)
and for each touched node stores aggregated values over all predecessors (upstream) and over all successors (downstream)
Its parameters are:
  `associationType` - the type of the association to traverse
  `upstreamAggregate` and `downstreamAggregate`, both conforming to the `aggregate` descriptor described above
  
`derive-associations` and `path-analysis` don't modify the original nodes, they create contextual nodes which only live
in the specified `result` property of the card set's contextual node.
The amended nodes of a result can be used in a chart instead of the original nodes of a set if the result is specified as
the `overlay` parameter of that chart. The framework will replace each node with the contextual node with the matching URI
before rendering the chart.

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

