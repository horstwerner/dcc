// Fill in with 'data' content of corresponding XHR requests if OFFLINE_MODE === true
export const config = //{"getGraph":false,"getTables":[],"startTemplate":"root"};
  {"getGraph": true, "getTables":  ["jira:ticket", "jira:team", "jira:bug"],
      "startTemplate":  "root", "displayNameAttribute":  "core:name", "theme":  "default", "logoAlign":  "right",
      "logoLink":  "http://github.com/horstwerner/dcc"};
export const dictionary = [
  {
    "uri": "id",
    "dataType": "STRING",
    "name": "id",
    "isAssociation": false
  },
  {
    "uri": "dcc:bugs",
    "dataType": "INTEGER",
    "name": "Bugs",
    "isAssociation": false
  },
  {
    "uri": "dcc:speed",
    "dataType": "FLOAT",
    "name": "Speed",
    "isAssociation": false
  },
  {
    "uri": "dcc:downstream",
    "dataType": "INTEGER",
    "name": "Downstream",
    "isAssociation": false
  },
  {
    "uri": "core:name",
    "dataType": "STRING",
    "name": "Name",
    "isAssociation": false
  },
  {
    "uri": "core:url",
    "dataType": "STRING",
    "name": "URL",
    "isAssociation": false
  },
  {
    "uri": "jira:ticket",
    "dataType": "ENTITY",
    "name": "Ticket",
    "isAssociation": false
  },
  {
    "uri": "jira:tickets_open",
    "dataType": "INTEGER",
    "name": "# open tickets",
    "isAssociation": false
  },
  {
    "uri": "jira:tickets_open",
    "dataType": "INTEGER",
    "name": "# open tickets",
    "isAssociation": false
  },
  {
    "uri": "jira:tickets_in_progress",
    "dataType": "INTEGER",
    "name": "# tickets in progress",
    "isAssociation": false
  },
  {
    "uri": "jira:tickets_in_review",
    "dataType": "INTEGER",
    "name": "# tickets in review",
    "isAssociation": false
  },
  {
    "uri": "jira:tickets_in_validation",
    "dataType": "INTEGER",
    "name": "# tickets in validation",
    "isAssociation": false
  },
  {
    "uri": "jira:tickets_closed",
    "dataType": "INTEGER",
    "name": "# tickets closed",
    "isAssociation": false
  },
  {
    "uri": "jira:bug",
    "dataType": "ENTITY",
    "name": "Bug",
    "subClassOf": "jira:ticket",
    "isAssociation": false
  },
  {
    "uri": "jira:story",
    "dataType": "ENTITY",
    "name": "Story",
    "subClassOf": "jira:ticket",
    "isAssociation": false
  },
  {
    "uri": "dcc:test",
    "dataType": "ENTITY",
    "name": "Test",
    "isAssociation": false
  },
  {
    "uri": "jira:ticket-type",
    "dataType": "STRING",
    "name": "Type",
    "isAssociation": false
  },
  {
    "uri": "jira:status",
    "dataType": "STRING",
    "name": "Status",
    "isAssociation": false
  },
  {
    "uri": "jira:storypoints",
    "dataType": "INTEGER",
    "name": "Story Points",
    "isAssociation": false
  },
  {
    "uri": "jira:depends-on",
    "dataType": "ENTITY",
    "name": "depends on",
    "isAssociation": true,
    "inverseType": "jira:is-prerequisite-for"
  },
  {
    "uri": "jira:is-prerequisite-for",
    "dataType": "ENTITY",
    "name": "is prerequisite for",
    "isAssociation": true,
    "inverseType": "jira:depends-on"
  },
  {
    "uri": "jira:team",
    "dataType": "ENTITY",
    "name": "Team",
    "isAssociation": false
  },
  {
    "uri": "jira:feature",
    "dataType": "STRING",
    "name": "Feature",
    "isAssociation": false
  },
  {
    "uri": "jira:sprint",
    "dataType": "STRING",
    "name": "Sprint",
    "isAssociation": false
  },
  {
    "uri": "jira:release",
    "dataType": "FLOAT",
    "name": "Release Number",
    "isAssociation": false
  }
];
export const templates = {
  "constants": [
    {"MARGIN":  20},
    {"CARD_BACKGROUND_COLOR":  "#FAFAFA"},
    {"AREA_BACKGROUND_COLOR":  "#F5F8FC"},
    {"TEXT_COLOR": "rgba(0,0,0,0.7)"},
    {"HEADING_COLOR": "rgba(0,0,0,0.83)"},
    {"TEXT_STYLE": {
        "color": {
          "$": "TEXT_COLOR"
        },
        "font-family": "Arial, sans serif"
      }},
    {"CARD_HEADING_STYLE": {
        "font-family": "Arial, sans serif",
        "color": {
          "$": "HEADING_COLOR"
        },
        "font-weight": "600",
        "font-size": "24px"
      }},
    {"GROUP_HEADING_STYLE": {
        "$": "CARD_HEADING_STYLE",
        "font-size": "18px"
      }},
    {"LABEL_STYLE": {
        "$": "TEXT_STYLE",
        "font-size": "14px",
        "font-weight": "medium"
      }},
    {"LABEL_SMALL_STYLE": {
        "$": "TEXT_STYLE",
        "font-size": "8px"
      }},
    {"STATUS_SEQUENCE": [
        "closed",
        "in validation",
        "in code review",
        "in progress",
        "blocked",
        "open"
      ]},
    {"COLOR_BY_STATUS": [
        {
          "condition": "=closed",
          "color": "#548546"
        },
        {
          "condition": "=in validation",
          "color": "#7ea550"
        },
        {
          "condition": "=in code review",
          "color": "#a3b630"
        },
        {
          "condition": "=in progress",
          "color": "#cfc726"
        },
        {
          "condition": "=blocked",
          "color": "#b65b56"
        },
        {
          "condition": "=open",
          "color": "#c0c0c0"
        }
      ]},
    {"DEFAULT_TICKET_COLOR": "#a0a0a0"},
    {"DEPENDENCY_COLORS":  [
        {
          "condition": "<5",
          "color": "#d0d0d0"
        },
        {
          "condition": "<12",
          "color": "#c7adab"
        },
        {
          "condition": "<20",
          "color": "#bf9f9e"
        },
        {
          "condition": "<30",
          "color": "#af8381"
        },
        {
          "condition": "<40",
          "color": "#b16b67"
        },
        {
          "condition": ">=40",
          "color": "#b65b56"
        }
      ]},
    {"USE_CARD_TRELLIS": {
        "key": "stories",
        "type": "card",
        "source": "jira:ticket",
        "template": "trellis",
        "x": -1000, "y": 10, "w": 400, "h": 500
      }},
    {"USE_CARD_GRAPH_ANALYSIS":     {
        "key": "storiesgrid",
        "type": "card",
        "source": "jira:ticket",
        "template": "graphAnalysis",
        "x": 20,
        "y": 10,
        "w": 1200,
        "h": 500
      }}
  ],
  "cards": [
    {
      "id": "jira:ticket",
      "name": "Default",
      "appliesTo": "jira:ticket",
      "aggregate": false,
      "background": {
        "type": "image",
        "source": "images/SimpleCard.svg",
        "w": 220,
        "h": 120,
        "cornerRadius": 6
      },
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
          "key": "heading",
          "type": "textfield",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 24,
          "attribute": "core:uri",
          "style": {
            "font-weight": "bold",
            "color": "white",
            "font-size": "20px",
            "h-align": "center"
          }
        },
        {
          "key": "name",
          "type": "textfield",
          "x": 8,
          "y": 44,
          "w": 200,
          "h": 32,
          "attribute": "core:name",
          "style": {
            "font-size": "12px",
            "color": {
              "$": "TEXT_COLOR"
            }
          }
        },
        {
          "key": "storybar",
          "type": "chart",
          "x": 8,
          "y": 102,
          "h": 10,
          "attribute": "jira:storypoints",
          "color": "rgba(0,0,0,0.15)",
          "chartType": "rect",
          "maxW": 200,
          "maxValue": 24
        },
        {
          "key": "storypts",
          "type": "textfield",
          "x": 8,
          "y": 67,
          "w": 30,
          "h": 20,
          "attribute": "jira:storypoints",
          "style": {
            "font-size": "16px",
            "font-weight": "bold",
            "color": {
              "$": "TEXT_COLOR"
            }
          }
        },
        {
          "key": "teamname",
          "type": "caption",
          "x": 50, "y": 67, "w": 80, "h": 18,
          "text": "Team: {{jira:team}}",
          "style": {"$": "LABEL_SMALL_STYLE"}
        },
        {
          "key": "status",
          "type": "caption",
          "x": 130,
          "y": 67,
          "w": 90,
          "h": 20,
          "text": "Status: {{jira:status}}",
          "style": {"$": "LABEL_SMALL_STYLE"}
        },
        {
          "key": "link",
          "type": "link",
          "x": 130,
          "y": 82,
          "w": 50,
          "h": 12,
          "url": "http://test.com/ticket/{{core:uri}}",
          "style": {
            "font-size": "8px",
            "font-weight": "normal"
          },
          "text": "Jira Link"
        }
      ]
    },
    {
      "id": "ticket-compact",
      "name": "Compact",
      "appliesTo": "jira:ticket",
      "detailTemplate": "jira:ticket",
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
          "x": 10, "y": 44, "w": 200, "h": 50,
          "attribute": "core:uri",
          "style": {"font-weight": "bold", "color": "white", "font-size": "30px", "h-align": "center"}
        }
      ]
    },
    {
      "id": "ticket-dependencies",
      "name": "Dependencies",
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
          "key": "heading",
          "type": "textfield",
          "x": 10,
          "y": 10,
          "w": 200,
          "h": 24,
          "attribute": "core:uri",
          "style": {
            "font-weight": "bold",
            "color": "white",
            "font-size": "20px",
            "h-align": "center"
          }
        },
        {
          "key": "name",
          "type": "textfield",
          "x": 8,
          "y": 44,
          "w": 200,
          "h": 32,
          "attribute": "core:name",
          "style": {
            "font-size": "12px",
            "color": {
              "$": "TEXT_COLOR"
            }
          }
        },
        {
          "key": "depends_on",
          "type": "textfield",
          "x": 8,
          "y": 74,
          "w": 200,
          "h": 32,
          "attribute": "jira:depends-on",
          "style": {
            "font-size": "12px",
            "color": {
              "$": "TEXT_COLOR"
            }
          }
        }
      ]
    },
    {
      "id": "stories-by-feature",
      "name": "Story Points by...",
      "appliesTo": "jira:ticket",
      "aggregate": true,
      "background": {
        "type": "rect",
        "w": 420,
        "h": 500,
        "color": {"$":  "AREA_BACKGROUND_COLOR"},
        "cornerRadius": 6
      },
      "clickable": true,
      "options":  {
        "grouping": {
          "caption": "Group by",
          "display": "radio-buttons",
          "selection": [
            {"label":  "Feature", "value": "jira:feature"}, {"label": "Team", "value": "jira:team"},
            {"label":  "Status", "value": "jira:status"}, {"label": "Release", "value": "jira:release"}],
          "defaultValue": "jira:team"
        }
      },
      "elements": [
        {
          "key": "label_features",
          "type": "caption",
          "style": {"$": "GROUP_HEADING_STYLE"},
          "x": {"$": "MARGIN"}, "y": {"$": "MARGIN"}, "w": 300, "h": 32,
          "text": "{{core:nodeCount}} Storypoints, grouped"
        },
        {
          "key": "features",
          "type": "trellis",
          "source": "core:subNodes",
          "inputSelector": {"jira:release": ">1.1"},
          "x": 20, "y": 60, "w": 360, "h": 430,
          "arrangement": {
            "type": "grid",
            "compact": true,
            "padding": 0
          },
          "align": {"storyPointSum": "max"},
          "template": "storyBarWithTitle",
          "groupAttribute": "$grouping"
        }
      ]
    },
    {
      "id": "root",
      "name": "Start View",
      "aggregate": true,
      "background": {
        "type": "rect",
        "w": 1620,
        "h": 940,
        "color": "#FEFEFD",
        "borderColor": "#E0E0E0",
        "cornerRadius": 6
      },
      "elements": [
        {
          "key": "map-feature",
          "type": "card",
          "template": "stories-by-feature",
          "source": "jira:ticket",
          "x": 20, "y":20, "w": 420, "h": 500
        },
        {
          "key": "bugs",
          "type": "card",
          "source": "~jira:bug",
          "template": "bugs",
          "x": 20, "y": 440, "w": 420, "h": 500
        },
        {
          "key": "dependencies",
          "type": "card",
          "source": "jira:ticket",
          "template": "dependency-graph",
          "x": 460, "y": 20, "w": 700, "h": 500
        },
        {
          "key": "burndown",
          "type": "card",
          "source": "#Analytics",
          "template": "burndown",
          "x": 460, "y": 540, "w": 700, "h": 300
        },
        {
          "key": "teams",
          "type": "card",
          "source": "~jira:team",
          "template": "team-overview",
          "x": 1180, "y":20, "w": 420, "h": 900
        }
      ]
    },
    {
      "id": "burndown",
      "name": "Burndown Chart",
      "appliesTo": "jira:team",
      "background": {
        "type": "rect",
        "w": 700,
        "h": 300,
        "color": {"$": "AREA_BACKGROUND_COLOR"},
        "cornerRadius": 6
      },
      "elements": [
        {
          "key": "label_title",
          "type": "caption",
          "style": {"$": "GROUP_HEADING_STYLE"},
          "x": {"$": "MARGIN"}, "y": {"$": "MARGIN"}, "w": 400, "h": 32,
          "text": "Burndown Chart"
        },
        {
          "key": "chart",
          "type": "chart",
          "chartType": "stackedArea",
          "xLabel": "Day",
          "strokeWidth": 2,
          "w": 660,
          "h": 220,
          "x": 20,
          "y": 60,
          "series": "core:series",
          "xAxis": "core:time",
          "attributes": [
            "jira:tickets_open", "jira:tickets_in_progress",
            "jira:tickets_in_review",
            "jira:tickets_in_validation",
            "jira:tickets_closed"
          ],
          "colors": ["#c0c0c0", "#cfc726", "#a3b630", "#7ea550", "#548546"]
        }
      ]
    },
    { "id": "bugs",
      "name": "Bugs",
      "appliesTo": "jira:bug",
      "aggregate": true,
      "background": {
        "type": "rect",
        "w": 420,
        "h": 300,
        "color": {"$": "AREA_BACKGROUND_COLOR"},
        "cornerRadius": 6
      },
      "options":  {
        "view": {
          "caption": "Ticket Style",
          "display": "radio-buttons",
          "selection": [
            {"label":  "Compact", "value": "Compact"}, {"label": "Full", "value": "Default"}
          ],
          "defaultValue": "Default"
        }
      },
      "clickable": true,
      "elements": [
        {
          "key": "label_title",
          "type": "caption",
          "style": {"$": "GROUP_HEADING_STYLE"},
          "x": {"$": "MARGIN"}, "y": {"$": "MARGIN"}, "w": 100, "h": 32,
          "text": "Bugs"
        },
        {
          "key": "nodes",
          "type": "cards",
          "source": "core:subNodes",
          "x": 20,
          "y": 60,
          "w": 380,
          "h": 200,
          "arrangement": {
            "type": "grid",
            "centerX": true,
            "lod": "full",
            "padding": 0.1
          },
          "viewName": "$view"
        }
      ]
    },
    {"id": "dependency-graph",
      "name": "Dependency Graph",
      "appliesTo": "jira:ticket",
      "aggregate": true,
      "background": {
        "type": "rect",
        "w": 700,
        "h": 500,
        "color": {"$": "AREA_BACKGROUND_COLOR"},
        "cornerRadius": 6
      },
      "options":  {
        "view": {
          "caption": "Ticket Style",
          "display": "radio-buttons",
          "selection": [
            {"label":  "Compact", "value": "Compact"}, {"label": "Full", "value": "Default"}
          ],
          "defaultValue": "Compact"
        },
        "highlight": {
          "caption": "Highlight",
          "display": "highlight",
          "reference": "graph",
          "selection": [
            {"label": "By Release", "value":  "jira:release"},
            {"label": "By Feature", "value":  "jira:feature"},
            {"label": "By Team", "value":  "jira:team"}
          ]
        }
      },
      "clickable": true,
      "elements": [
        {
          "key": "label_title",
          "type": "caption",
          "style": {"$": "GROUP_HEADING_STYLE"},
          "x": {"$": "MARGIN"}, "y": {"$": "MARGIN"}, "w": 150, "h": 32,
          "text": "Dependencies"
        },
        {
          "key": "graph",
          "type": "chart",
          "source": "core:subNodes",
          "inputSelector": {"jira:release": "=1.2"},
          "bounded": false,
          "chartType": "graph",
          "x": 20, "y": 60, "w": 660, "h": 440,
          "minScale": 0.1, "maxScale": 2,
          "swimLanes": "jira:team",
          "path": "jira:is-prerequisite-for[jira:ticket]*",
          "edgeAnnotations": [{"pointsRight":  true, "helpTemplate":  "relDependsOn",
            "toolTip": "depends on"
          }],
          "viewName": "$view"
        },
        {
          "key": "info",
          "type": "info",
          "x": 158,
          "y": {"$": "MARGIN"},
          "size": 19,
          "templateId": "graphHelp"
        }
      ]
    },
    {
      "id": "storiesByStatus",
      "name": "Cards",
      "appliesTo": "jira:ticket",
      "aggregate": true,
      "background": {
        "type": "rect",
        "w": 600,
        "h": 600,
        "cornerRadius": 6,
        "color":  {"$":  "AREA_BACKGROUND_COLOR"},
        "x": 0,
        "y": 0
      },
      "clickable": true,
      "preprocessing": [
        {"source": "core:subNodes",
          "function":  "aggregate",
          "set": {
            "storyPointSum": {
              "attribute": "jira:storypoints",
              "calculate": "sum"
            }}
        }
      ],
      "options": {
        "highlight": {
          "caption": "Highlight",
          "display": "highlight",
          "selection": [
            {"label": "By Release", "value":  "jira:release"},
            {"label": "By Feature", "value":  "jira:feature"},
            {"label": "By Team", "value":  "jira:team"}
          ]
        }
      },
      "elements": [
        {
          "key": "title",
          "type": "caption",
          "style": {
            "color": "#A0A0A0",
            "font-weight": "bold",
            "font-size": "24px",
            "h-align": "left"
          },
          "x": 30,
          "y": 20,
          "w": 200,
          "h": 32,
          "text": "{{core:nodeCount}} Stories"
        },
        {
          "key": "storyptLabel",
          "type": "caption",
          "text": "Total Storypoints:",
          "x": 240,
          "y": 32,
          "w": 200,
          "h": 24,
          "style": {
            "color": "#A0A0A0",
            "font-size": "12px",
            "font-weight": "bold",
            "h-align": "left"
          }
        },
        {
          "key": "storypts",
          "type": "textfield",
          "attribute": "storyPointSum",
          "x": 348,
          "y": 30,
          "w": 200,
          "h": 24,
          "style": {
            "color": "#A0A0A0",
            "font-size": "16px",
            "font-weight": "bold",
            "h-align": "left"
          }
        },
        {
          "key": "storybar",
          "type": "chart",
          "source": "core:subNodes",
          "sortSequence": {
            "$": "STATUS_SEQUENCE"
          },
          "chartType": "stackedBar",
          "x": 20,
          "y": 60,
          "w": 360,
          "h": 20,
          "widthAttribute": "jira:storypoints",
          "colorAttribute": "jira:status",
          "colors": {
            "$": "COLOR_BY_STATUS"
          },
          "defaultColor": {
            "$": "DEFAULT_TICKET_COLOR"
          },
          "totalWidthValue": "storyPointSum"
        },
        {
          "key": "nodes",
          "type": "cards",
          "source": "core:subNodes",
          "x": 20,
          "y": 100,
          "w": 560,
          "h": 480,
          "arrangement": {
            "type": "grid",
            "lod": "full",
            "padding": 0.1
          },
          "template": "ticket-compact"
        }
      ]
    },
    {
      "id": "storyBarWithTitle",
      "aggregate": true,
      "background": {"type": "rect", "w": 380, "h": 30,
        "color": "rgba(0,0,0,0)"
      },
      "preprocessing": [{"function":  "aggregate", "set":  {"storyPointSum":  {"attribute": "jira:storypoints", "calculate":  "sum"}}}],
      "elements": [
        {
          "key": "label",
          "type": "textfield",
          "attribute": "core:name",
          "x": 0, "y": 8, "w": 148, "h": 20,
          "style": {
            "$": "LABEL_STYLE",
            "h-align": "right"
          }
        },
        {
          "key": "storybar",
          "type": "chart",
          "source": "core:subNodes",
          "sortSequence": {
            "$": "STATUS_SEQUENCE"
          },
          "chartType": "stackedBar",
          "x": 160, "y": 8, "w": 200, "h": 20,
          "totalWidthValue": "storyPointSum",
          "widthAttribute": "jira:storypoints",
          "colorAttribute": "jira:status",
          "colors": {
            "$": "COLOR_BY_STATUS"
          },
          "defaultColor": {
            "$": "DEFAULT_TICKET_COLOR"
          }
        }
      ]
    },
    {
      "id": "storyBarByStatus",
      "aggregate": true,
      "background": { "type": "rect", "w": 400, "h": 70},
      "preprocessing": [
        {"function":  "aggregate",
          "set": {
            "storyPointSum": {
              "attribute": "jira:storypoints",
              "calculate": "sum"
            },
            "secondSum": {
              "attribute": "jira:storypoints",
              "calculate": "sum"
            }}
        }
      ],
      "elements": [
        {
          "key": "label",
          "type": "textfield",
          "attribute": "core:name",
          "x": 0, "y": 0, "w": 400, "h": 25,
          "style": {"$": "GROUP_HEADING_STYLE"}
        },
        {
          "key": "counter",
          "type": "caption",
          "text": "{{core:nodeCount}} Stories, {{secondSum}} Story Points",
          "x": 200, "y": 6, "w": 200, "h": 16,
          "style": {"font-size": "16px", "color": "#A0A0A0", "h-align": "right"}
        },
        {
          "key": "storybar",
          "type": "chart",
          "source": "core:subNodes",
          "sortSequence": {
            "$": "STATUS_SEQUENCE"
          },
          "chartType": "stackedBar",
          "x": 0, "y": 30, "w": 400, "h": 30,
          "totalWidthValue": "storyPointSum",
          "widthAttribute": "jira:storypoints",
          "colorAttribute": "jira:status",
          "colors": {"$": "COLOR_BY_STATUS"},
          "defaultColor": {"$": "DEFAULT_TICKET_COLOR"}
        }
      ]
    },
    {
      "id": "trellisByRelease+Status",
      "name": "by Release",
      "appliesTo": "jira:ticket",
      "aggregate": true,
      "background": {
        "type": "rect",
        "w": 300,
        "h": 500,
        "cornerRadius": 6,
        "color": {"$": "AREA_BACKGROUND_COLOR"},
        "x": 0,
        "y": 0
      },
      "clickable": true,
      "preprocessing": [
        {"function":  "aggregate",
          "set": {
            "storyPointSum": {
              "attribute": "jira:storypoints",
              "calculate": "sum"
            }}}
      ],
      "elements": [
        {
          "key": "title",
          "type": "caption",
          "text": "{{core:nodeCount}} Stories",
          "style": {
            "$": "CARD_HEADING_STYLE"
          },
          "x": 20,
          "y": 20,
          "w": 200,
          "h": 32
        },
        {
          "key": "storyptLabel",
          "type": "caption",
          "text": "Total Storypoints:",
          "x": 20,
          "y": 60,
          "w": 200,
          "h": 24,
          "style": {
            "color": "#A0A0A0",
            "font-size": "12px",
            "h-align": "left",
            "font-weight": "bold"
          }
        },
        {
          "key": "storypts",
          "type": "textfield",
          "attribute": "storyPointSum",
          "x": 130,
          "y": 56.5,
          "w": 60,
          "h": 24,
          "style": {
            "color": "#A0A0A0",
            "font-size": "16px",
            "h-align": "left",
            "font-weight": "bold"
          }
        },
        {
          "key": "trellis",
          "type": "trellis",
          "source": "core:subNodes",
          "x": 20,
          "y": 100,
          "w": 260,
          "h": 400,
          "arrangement": {
            "type": "grid",
            "compact": true,
            "padding": 0.1
          },
          "align": {
            "storyPointSum": "max"
          },
          "template": "storyBarByStatus",
          "groupAttribute": "jira:release"
        }
      ]
    },
    {
      "id": "storyBarByImpact",
      "aggregate": true,
      "background": {"type": "rect", "w": 660, "h": 30},
      "preprocessing": [
        {"function":  "aggregate",
          "set": {"storyPointSum":  {"attribute":  "jira:storypoints", "calculate":  "sum"}}
        },
        {"function":  "aggregate",
          "source": "core:context/allNodes",
          "set": {"totalStoryPointSum":  {"attribute":  "jira:storypoints", "calculate":  "sum"}}
        },
        {
          "set": "dependencies",
          "function": "path-analysis",
          "inputSelector": {"jira:release": "=1.2"},
          "associationType": "jira:is-prerequisite-for",
          "upstreamAggregate": {
            "upstream-storypoints": {"attribute": "jira:storypoints", "calculate": "sum"}
          },
          "downstreamAggregate": {
            "downstream-storypoints": {"attribute": "jira:storypoints", "calculate": "sum"}
          }
        }],
      "elements": [
        {
          "key": "label",
          "type": "textfield",
          "attribute": "core:name",
          "x": 0, "y": 0, "w": 180, "h": 20,
          "style": {"$": "LABEL_STYLE", "h-align":  "right"}
        },
        {
          "key": "sourceBar",
          "type": "chart",
          "source": "core:subNodes",
          "overlay": "dependencies",
          "inputSelector": {"jira:release": "=1.2"},
          "sortSequence": "byUri",
          "chartType": "stackedBar",
          "x": 200, "y": 0, "w": 150, "h": 20,
          "totalWidthValue": "storyPointSum",
          "widthAttribute": "jira:storypoints",
          "colorAttribute": "downstream-storypoints",
          "colors": {"$":  "DEPENDENCY_COLORS"},
          "defaultColor": "#d0d0d0"
        },
        {
          "key": "storybar",
          "type": "chart",
          "source": "core:context/allNodes",
          "overlay": "dependencies",
          "sortSequence": "byUri",
          "chartType": "stackedBar",
          "x": 400, "y": 0, "w": 260, "h": 20,
          "totalWidthValue": "totalStoryPointSum",
          "widthAttribute": "jira:storypoints",
          "colorAttribute": "upstream-storypoints",
          "colors": {"$":  "DEPENDENCY_COLORS"},
          "defaultColor": "#d0d0d0"
        }
      ]
    },
    {
      "id": "dependencyAnalysis",
      "name": "Dependency Analysis",
      "aggregate": true,
      "appliesTo": "jira:ticket",
      "background": {
        "type": "rect", "w": 720, "h": 500,
        "cornerRadius": 6,
        "color": {"$": "AREA_BACKGROUND_COLOR"}
      },
      "options":  {
        "grouping": {
          "caption": "Group by",
          "display": "radio-buttons",
          "selection": [
            {"label":  "Feature", "value": "jira:feature"}, {"label": "Team", "value": "jira:team"},
            {"label":  "Status", "value": "jira:status"}, {"label": "Release", "value": "jira:release"}],
          "defaultValue": "jira:team"
        }
      },
      "clickable": true,
      "preprocessing": [{"set-context":  "allNodes", "source": "core:subNodes"}],
      "elements": [
        {
          "key": "label_impact",
          "type": "caption",
          "style": {"$": "LABEL_STYLE", "font-weight": "bold"},
          "x": 220, "y": 20, "w": 150, "h": 32,
          "text": "Stories in 1.2\nColor by Impact"
        },
        {
          "key": "label_dependency",
          "type": "caption",
          "style": {"$": "LABEL_STYLE", "font-weight": "bold"},
          "x": 420, "y": 20, "w": 300, "h": 32,
          "text": "All Stories\nColor by upstream Dependencies"
        },
        {
          "key": "trellis",
          "type": "trellis",
          "source": "core:subNodes",
          "x": 20, "y": 80, "w": 660, "h": 600,
          "arrangement": {"type": "grid", "compact": true, "padding": 0.1},
          "align": {"storyPointSum": "max"},
          "template": "storyBarByImpact",
          "groupAttribute": "$grouping"
        }
      ]
    },
    {
      "id": "jira:team",
      "name": "Default",
      "appliesTo": "jira:team",
      "aggregate": false,
      "size": {
        "w": 400,
        "h": 150
      },
      "background": {
        "type": "rect",
        "color": {"$": "CARD_BACKGROUND_COLOR"},
        "borderColor": "#E8E8E8",
        "w": 400,
        "h": 150,
        "cornerRadius": 6
      },
      "clickable": true,
      "preprocessing": [{"source": "jira:ticket", "function":  "aggregate", "set": {"storyPointSum":  {"attribute":  "jira:storypoints", "calculate": "sum"}, "storyPoints": {"attribute":  "jira:storypoints", "calculate": "sum"}}}],
      "elements": [
        {
          "key": "heading",
          "type": "textfield",
          "x": 12, "y": 10, "w": 80, "h": 18,
          "attribute": "core:name",
          "style": {"$": "LABEL_STYLE"}
        },
        {
          "key": "warning",
          "type": "image",
          "condition": {"storyPoints": ">120"},
          "x": 160, "y": 10, "w": 30, "h": 30,
          "source": "images/Warning.svg"
        },
        {
          "key": "storycaption",
          "type": "caption",
          "x": 12, "y": 48, "w": 140, "h": 18,
          "text": "Stories ({{storyPoints}} story points)",
          "style": {"$": "LABEL_SMALL_STYLE"}
        },
        {
          "key": "storybar",
          "type": "chart",
          "source": "jira:ticket",
          "sortSequence": {
            "$": "STATUS_SEQUENCE"
          },
          "chartType": "stackedBar",
          "x": 12, "y": 60, "w": 200, "h": 30,
          "widthAttribute": "jira:storypoints",
          "colorAttribute": "jira:status",
          "colors": {
            "$": "COLOR_BY_STATUS"
          },
          "defaultColor": {
            "$": "DEFAULT_TICKET_COLOR"
          },
          "totalWidthValue": "storyPointSum"
        },
        {
          "key": "polarBear",
          "type": "chart",
          "chartType": "polar",
          "x": 250,
          "y": 30,
          "diameter": 130,
          "dimensions": ["dcc:bugs", "storyPoints", "dcc:downstream"],
          "maxValues": {"dcc:bugs": 140, "storyPoints": 180, "dcc:downstream": 100},
          "colorStops": [{"percent": "0", "color":  "#548546"}, {"percent": "25", "color":  "#7ea550"}, {"percent":  "35", "color":  "#a3b630"}, {"percent":  "50", "color":  "#cfc726"},{"percent":  "60", "color":  "#cfc726"}, {
            "percent": "90", "color": "#b65b56"} ],
          "labels": ["Bugs", "Load", "Downstream"],
          "labelStyle": {"$": "LABEL_SMALL_STYLE"}
        }
      ]
    },
    {
      "id": "team-overview",
      "name": "Teams",
      "appliesTo": "jira:team",
      "aggregate": true,
      "background": {
        "type": "rect",
        "w": 420,
        "h": 900,
        "color": {"$":  "AREA_BACKGROUND_COLOR"},
        "cornerRadius": 6
      },
      "clickable": true,
      "elements": [
        {
          "key": "label_teams",
          "type": "caption",
          "style": {"$": "GROUP_HEADING_STYLE"},
          "x": {"$": "MARGIN"}, "y": {"$": "MARGIN"}, "w": 100, "h": 32,
          "text": "Teams"
        },
        {
          "key": "teams",
          "type": "cards",
          "source": "core:subNodes",
          "align": {"storyPointSum": "max"},
          "x": 35, "y": 50, "w": 380, "h": 790,
          "arrangement": {
            "type": "grid",
            "padding": 0.1
          },
          "template": "jira:team"
        }
      ]
    },
    {
      "id": "graphHelp",
      "appliesTo": "core:static",
      "background": {
        "type": "rect",
        "color": {"$": "CARD_BACKGROUND_COLOR"},
        "borderColor": "#E8E8E8",
        "w": 800,
        "h": 600,
        "cornerRadius": 6
      },
      "elements": [
        {
          "key": "stripe",
          "type": "box",
          "background-color":  "#407090",
          "x": 0, "y": 0, "w": 800, "h": 48
        },
        {
          "key": "heading",
          "type": "caption",
          "x": 12, "y": 10, "w": 300, "h": 36,
          "text": "Dependency Graph",
          "style": {"font-size": "26px", "font-weight":  "bold", "color": "white"}
        },
        {
          "key": "screenshot",
          "type": "image",
          "source": "images/graph_sample.png",
          "border": "solid 2px #C0C0C0",
          "x": 12, "y": 64, "w": 280, "h": 180
        },
        {
          "key": "text1",
          "type": "caption",
          "style": {"font-size": "20px", "line-height":  "1.5"},
          "text": "The dependency graph visualizes the 'is prerequisite for' associations between tickets. It orders the cards so that the cards with the deepest dependencies are the rightmost.",
          "x": 320, "y": 64, "w": 460, "h": 180
        }
      ]
    },
    {
      "id": "relDependsOn",
      "appliesTo": "core:static",
      "background": {
        "type": "rect",
        "color": {"$": "CARD_BACKGROUND_COLOR"},
        "borderColor": "#E8E8E8",
        "w": 480,
        "h": 320,
        "cornerRadius": 6
      },
      "elements": [
        {
          "key": "stripe",
          "type": "box",
          "background-color":  "#407090",
          "x": 0, "y": 0, "w": 480, "h": 48
        },
        {
          "key": "heading",
          "type": "caption",
          "x": 12, "y": 10, "w": 300, "h": 36,
          "text": "Relation 'Depends on'",
          "style": {"font-size": "26px", "font-weight":  "bold", "color": "white"}
        },
        {
          "key": "text1",
          "type": "caption",
          "style": {"font-size": "18px", "line-height":  "1.5"},
          "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
          "x": 12, "y": 64, "w": 460, "h": 220
        }
      ]
    }
  ]
};
export const tools = {"tools":[
    {"id":  "release-selector",
      "name": "By Release",
      "label": "Release",
      "default": true,
      "type": "filter",
      "display": "radio-buttons",
      "appliesTo": "jira:ticket",
      "values": ["1.2", "1.3", "1.4"],
      "width": 220  ,
      "filter": "jira:release"
    },
    {"id":  "feature-selector",
      "name": "By Feature",
      "label": "Feature",
      "default": false,
      "type": "filter",
      "display": "dropdown",
      "appliesTo": "jira:ticket",
      "width": 220,
      "labelWidth": 70,
      "filter": "jira:feature"
    },
    {"id":  "team-selector",
      "name": "By Team",
      "label": "Team",
      "default": false,
      "type": "filter",
      "display": "dropdown",
      "appliesTo": "jira:ticket",
      "width": 150,
      "labelWidth": 50,
      "filter": "jira:team"
    },
    {"id":  "status-selector",
      "name": "By Status",
      "label": "Status",
      "default": false,
      "type": "filter",
      "display": "dropdown",
      "appliesTo": "jira:ticket",
      "width": 180,
      "labelWidth": 50,
      "filter": "jira:status"
    }
  ]};