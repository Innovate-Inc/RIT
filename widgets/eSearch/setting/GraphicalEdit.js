///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eSearch Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console*/
define(
  ["dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "jimu/BaseWidgetSetting",
    "jimu/dijit/Message",
    "dojo/text!./GraphicalEdit.html"
  ],
  function(
    declare,
    lang,
    array,
    on,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    template) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: "graphical-options-edit",
      templateString: template,
      _graphicaloption: null,
      config:null,
      dnls:null,

      postMixInProperties:function(){
        this.dnls = window.jimuNls.drawBox;
      },

      postCreate: function() {
        this.inherited(arguments);
        this._setConfig(this.config);
      },

      startup: function() {
        this.inherited(arguments);
      },

      _setConfig: function(config) {
        this.config = config;
        if(!this.config){
          return;
        }
        this._graphicaloption = [{
          "name": "enablepointselect",
          "label": this.dnls.point
        },{
          "name": "enablelineselect",
          "label": this.dnls.line
        },{
          "name": "enablepolylineselect",
          "label": this.dnls.polyline
        },{
          "name": "enablefreehandlineselect",
          "label": this.dnls.freehandPolyline
        },{
          "name": "enabletriangleselect",
          "label": this.dnls.triangle
        },{
          "name": "enableextentselect",
          "label": this.dnls.extent
        },{
          "name": "enablecircleselect",
          "label": this.dnls.circle
        },{
          "name": "enableellipseselect",
          "label": this.dnls.ellipse
        },{
          "name": "enablepolyselect",
          "label": this.dnls.polygon
        },{
          "name": "enablefreehandpolyselect",
          "label": this.dnls.freehandPolygon
        }];
        this._initGraphicalTable();
      },

      _initGraphicalTable:function(){
        this.GraphicalSearchTable.clear();
        this.GraphicalSearchTable.on('row-click', lang.hitch(this, function(){
          this._checkSelections();
        }));
        var graOps = this.config;
        console.info(this.config);
        array.forEach(this._graphicaloption, lang.hitch(this, function(graOp) {
          var args = {
            config: graOp,
            exists: graOps.hasOwnProperty(graOp.name)
          };
          this._createGraphicalOps(args);
        }));
      },

      _checkSelections: function(){
        var trs = this.GraphicalSearchTable.getRowDataArrayByFieldValue("add",true);
        if(trs.length === 0){
          this.popup.disableButton(0);
        }else{
          this.popup.enableButton(0);
        }
      },

      _createGraphicalOps:function(args){
        args.searchSetting = this;
        args.nls = this.nls;
        var rowData = {
          add: args.exists,
          label: (args.config && args.config.label)||'',
          name: (args.config && args.config.name)||''
        };
        var result = this.GraphicalSearchTable.addRow(rowData);
        if(!result.success){
          return null;
        }
        return result.tr;
      },

      getConfig: function() {
        var trs = this.GraphicalSearchTable.getRowDataArrayByFieldValue("add",true);
        var graOps = {};
        array.map(trs,lang.hitch(this,function(item){
          graOps[item.name] = true;
        }));
        return graOps;
      }
    });
  });
