# Soft-coded Filters
For each node type, user-selectable tools can be defined in the toolFile specified in the configuration.
At this time, the only type of tool supported are filters.

These filters will be displayed in the "Filters" box in the sidebar whenever a set of the respective node type is
displayed in an aggregate card in the focus area.

The tool file (for the test data `tools.json`) contains an array of objects of the following shape
* `id` - a unique key for the tool
* `label` - the display name shown next to the filter in the bottom bar
* `appliesTo` - the node type it applies to
* `default` - `true` or `false`, indicates whether this tool is visible in the bottom toolbar by default
* `type` - always `filter`
* `filter` - the name of the node attribute evaluated for filtering
* `display` - the widget used for the filter, `radio-buttons` or `dropdown`
* `width` width in pixels of the filter widget

If `display` is `radio-buttons`, these additional parameters are specified: 
* `values` - an array of selectable values (currently only predefined values are supported)

If `dislpay` is `dropdown`, the values are dynamically retrieved from the currently displayed set of nodes.
for the dropdown, this (optional) parameter can be specified:
* `labelWidth` specifies the width of the label next to the filter (this is included in the total width)


Example:
```
    {"id":  "release-selector",
      "name": "Release Selector",
      "label": "Release",
      "type": "filter",
      "display": "radio-buttons",
      "appliesTo": "jira:ticket",
      "alignment": "horizontal",
      "values": ["1.2", "1.3", "1.4"],
      "width": 330  ,
      "height": 34,
      "filter": "jira:release"
    }
```

When the user selects such a filter, the data will be filtered before it is fed into the aggregated card template, the
template itself is in no way aware of this filtering. Any `inputSelector` in the template will be applied independently
to the already filtered node list.

Note: the test data also contains a filter of type `trellis` (for filtering tickets by status), which is experimental.
The problem with this kind of widget is that it depends on data and therefore will change shape as soon as the filter is
applied.
