define(['dojo/_base/declare', 'jimu/BaseWidget', "esri/map", "dgrid/OnDemandGrid", "dojo/store/Memory", "esri/dijit/Geocoder", "dijit/form/HorizontalSlider",
    "esri/layers/FeatureLayer", "esri/tasks/query", "dojo/query", "esri/geometry/Circle",
    "esri/graphic", "esri/InfoTemplate", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/renderers/SimpleRenderer",
    "esri/config", "esri/Color", "dojo/dom", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/layers/LayerInfo", "dijit/form/CheckBox", "dojo/_base/array", "dojo/on"],
function (declare, BaseWidget, sMap, Grid, Memory, Geocoder, HorizontalSlider, FeatureLayer, Query, query, Circle, Graphic, InfoTemplate, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, SimpleRenderer, config, Color, dom, ArcGISDynamicMapServiceLayer, LayerInfo, CheckBox, arrayUtils, on) {
    //To create a widget, you need to derive from BaseWidget.
    
    //var queryLayer;
    var curMap;
    var selTool;
    var buffDist;  //Search Distance
    var lChecked = []; //Layers that are checked
    //var query = new Query();
    var featLayerList = [];
    var featLayerIndex =0;
    return declare([BaseWidget], {
    // DemoWidget code goes here 

    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);

      //Setup geocode event
        var geocoder = new Geocoder({
            arcgisGeocoder: {
                placeholder: "Find a place"
            },
            autoComplete: true,
            map: curMap
        }, dom.byId("search"));
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      console.log('startup');

      //on select event for geocoding
        geocoder.on("select", this.geocodeSelect);
        //add slider widget
        var slider = new HorizontalSlider({
            name: "slider",
            value: 5,
            minimum: 1,
            maximum: 100,
            discreteValues: 100,
            intermediateChanges: false,
            style: "width:300px;",
            onChange: function (value) {
                dom.byId("sliderValue").value = value;
                buffDist = value;
                //alert(buffDist);
            }
        }, "slider").startup();

         curMap = this.map

         //Layer List
        var visible = [];
        var layer = curMap.getLayer("P2I_web_service_2015_retail_2266");
        //alert(curMap.layerIds[1]);
        var items = arrayUtils.map(layer.layerInfos, function(info, index) {
            /*if (info.defaultVisibility) {
              visible.push(info.id);
            }*/
             //lChecked = visible;
            //alert(info.parentLayerId);
            if(info.parentLayerId == -1){
                if(!!info.subLayerIds) {
                    return "<div ><input type='checkbox' class='group_layer'" + "' id='" + info.id + "' /><label for='" + info.id + "'>" + info.name + "</label></div>";
                } else{
                    return "<div><input type='checkbox' class='list_item'" + "' id='" + info.id + "' /><label for='" + info.id + "'>" + info.name + "</label></div>";
                }
               //return "<div><input type='checkbox' class='list_item'" + (info.defaultVisibility ? "checked=checked" : "") + "' id='" + info.id + "'' /><label for='" + info.id + "'>" + info.name + "</label></div>";
               //return "<div>"+ info.name +"</div>";
            }
            return  "<div class='sub_layer' style='display: none'><input type='checkbox' style='' class='list_item'"  + "' id='" + info.id + "'' /><label for='" + info.id + "'>" + info.name + "</label></div>";
          });

          var ll = dom.byId("layer_list");
          ll.innerHTML = items.join(' ');
          //layer.setVisibleLayers(visible);
          on(ll, "click", updateLayerVisibility);

          var group = document.getElementsByClassName("group_layer");
          for(var ie = 0; ie<group.length; ie++){
            on(group[ie], "click", updateGroupLayer);
          }

          function updateGroupLayer(){
           // alert("group layer");
            //alert(this.id);
            //alert(layer.layerInfos[this.id].subLayerIds[0]);
            var idLayer = [];
            idLayer = layer.layerInfos[this.id].subLayerIds;
            //alert( "idlayer " + idLayer);
            var par = document.getElementById(this.id);
            for(var i = 0; i< idLayer.length; i++){
                var el = document.getElementById(layer.layerInfos[this.id].subLayerIds[i]);
                if(par.checked ==true){
                    el.checked = true;
                    el.parentNode.style.display = "block";
                }else{
                    el.checked = false;
                    el.parentNode.style.display = "none";
                } 
                //el.style.display = "none"; //inline
            }
            //document.getElementById(layer.layerInfos[0].subLayerIds[0]).checked = false;   
          }

          function updateLayerVisibility() {
            var inputs = query(".list_item");
            var input;
            visible = [];

            arrayUtils.forEach(inputs, function(input) {

                if (input.checked) {
                visible.push(input.id);
                }
            });
          //if there aren't any layers visible set the array to be -1
            if (visible.length === 0) {
                visible.push(-1);
            }
            lChecked = visible;
            //alert( "list  " + lChecked);
            //layer.setVisibleLayers(visible);
        }
        //End LayerLise
         
    },
    /* resultsClick: function(evt){
            alert("clicked");
     },*/
    mapClick: function (evt) {
        //alert("onclick is working");
        //alert(lChecked);
        if(lChecked == -1){
            alert("Please select a layer to select form");
            return;
        }
        //get point where mouse clicked
        var point = evt.mapPoint;
        //Clear graphics on map and add graphic where user clicked
        curMap.graphics.clear();
        var symbol = new SimpleMarkerSymbol().setStyle(
          SimpleMarkerSymbol.STYLE_SQUARE).setColor(
          new Color([255, 0, 0, 0.5])
        );
        var graphic = new Graphic(point, symbol);
        curMap.graphics.add(graphic);
        //Add buffer of users specified distance
        var circleSymb = new SimpleFillSymbol(
              SimpleFillSymbol.STYLE_NULL,
              new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                new Color([105, 105, 105]),
                2
              ), new Color([255, 255, 0, 0.25])
            );

        //alert(buffDist);
        circle = new Circle({
            center: point,
            geodesic: true,
            radius: buffDist,
            radiusUnit: "esriMiles"
        });
        //thisMap.graphics.clear();
        curMap.infoWindow.hide();
        var graphic = new Graphic(circle, circleSymb);
        curMap.graphics.add(graphic);

        var query1 = new Query();
        query1.geometry = circle.getExtent();

        //use a fast bounding box query. will only go to the server if bounding box is outside of the visible map
        //fLayer.queryFeatures(query1, selObject.selectInBuffer);
        
        //loop through each layer that was checked
        lChecked.forEach(function (element, index, array) {
            //alert(element);
            if (element !== undefined) {
                var featLayer = new FeatureLayer("https://geoapps64.main.ad.rit.edu:6443/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/"+element, {
                    //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
                    mode: FeatureLayer.MODE_SELECTION,
                    outFields: ["*"]
                });
                 featLayerList[featLayerIndex] = featLayer;
                 featLayerIndex++;
                 //selection symbol used to draw the selected census block points within the buffer polygon
                var symbol = new SimpleMarkerSymbol(
                  SimpleMarkerSymbol.STYLE_CIRCLE,
                  12,
                  new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_NULL,
                    new Color([247, 34, 101, 0.9]),
                    1
                  ),
                  new Color([207, 34, 171, 0.5])
                );
                featLayer.setSelectionSymbol(symbol);

                //make unselected features invisible
                var nullSymbol = new SimpleMarkerSymbol().setSize(0);
                featLayer.setRenderer(new SimpleRenderer(nullSymbol));
                curMap.addLayer(featLayer);

                featLayer.queryFeatures(query1, function (response) {
                    var feature;
                    var features = response.features;
                    //alert(features.length + " features");
                    var inBuffer = [];
                    //filter out features that are not actually in buffer, since we got all points in the buffer's bounding box
                    for (var i = 0; i < features.length; i++) {
                        feature = features[i];
                        if (circle.contains(feature.geometry)) {
                            inBuffer.push(feature.attributes[featLayer.objectIdField]);
                        }
                    }

                    //remove previous results
                    var mesResults = document.getElementById("messages");
                    while (mesResults.firstChild) {
                        mesResults.removeChild(mesResults.firstChild);
                    }

                    //alert(inBuffer.length);
                    var query = new Query();
                    query.objectIds = inBuffer;
                    query.returnGeometry = true;
                    query.outFields = ["*"];
                    //use a fast objectIds selection query (should not need to go to the server)
                    featLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function (results) {

                        //alert("Query Complete on " + featLayer.name);
                        var facilityName = organizeResults(results);
                        var r = "";

                        //Add results to the grid
                        window.grid = new (declare([Grid, Selection]))({
                            bufferRows: Infinity,
                            "Name": "Facility_Name"
                        },"grid");

                        //featLayer.on("click", selectGrid);

                        var data = array.map(results.features, function(feature){
                            return{
                                "Name": feature.attributes["Facility_Name"]
                            };
                        });
                        var memstore = new Memory({data: data});
                        window.grid.set("store", memstore);



                        r = "<div><b>" + featLayer.name + "</b></div><i><div>" + facilityName + "</div></i>";
                        dom.byId("messages").innerHTML = dom.byId("messages").innerHTML + r;
                    }, function (e) {
                        alert(e);
                    });


                   function organizeResults(features) {
                        var popTotal = "";
                        for (var x = 0; x < features.length; x++) {
                            popTotal = popTotal + "<div onclick='resultList'>" + features[x].attributes["Facility_Name"] + "</div>";
                        }
                        function resultList(){
                            alert("clicked result");
                        }
                        //popTotal = popTotal + "</ul>";
                        //alert(popTotal + "facility");
                        return popTotal;
                    }
                  
                });
                
            }  
        });
        //alert(queryLayer[0])
        //alert(queryLayer[1])
        //alert(queryLayer[2])
    },
    
    selectInBuffer: function (response) {
        //var feature;
        //var features = response.features;
        //alert(features.length + " features");
    },

    geocodeSelect: function (evt) {
        //alert("geocoded");
        var point = evt.result.feature.geometry;
        //Clear graphics on map and add graphic where user clicked
        curMap.graphics.clear();
        var symbol = new SimpleMarkerSymbol().setStyle(
          SimpleMarkerSymbol.STYLE_SQUARE).setColor(
          new Color([255, 0, 0, 0.5])
        );
        var graphic = new Graphic(point, symbol);
        curMap.graphics.add(graphic);
        //Add buffer of users specified distance
        var circleSymb = new SimpleFillSymbol(
              SimpleFillSymbol.STYLE_NULL,
              new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                new Color([105, 105, 105]),
                2
              ), new Color([255, 255, 0, 0.25])
            );

        //alert("do buffer");
        circle = new Circle({
            center: point,
            geodesic: true,
            radius: buffDist,
            radiusUnit: "esriMiles"
        });
        //thisMap.graphics.clear();
        curMap.infoWindow.hide();
        var graphic = new Graphic(circle, circleSymb);
        curMap.graphics.add(graphic);

        var query1 = new Query();
        query1.geometry = circle.getExtent();

        //use a fast bounding box query. will only go to the server if bounding box is outside of the visible map
        //fLayer.queryFeatures(query1, selObject.selectInBuffer);

        //loop through each layer that was checked
         lChecked.forEach(function (element, index, array) {
            //alert('a[' + index + '] = ' + element);
            if (element !== undefined) {
                var featLayer = new FeatureLayer("https://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/"+element, {
                    //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
                    mode: FeatureLayer.MODE_SELECTION,
                    outFields: ["*"]
                });

                //selection symbol used to draw the selected census block points within the buffer polygon
                var symbol = new SimpleMarkerSymbol(
                  SimpleMarkerSymbol.STYLE_CIRCLE,
                  12,
                  new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_NULL,
                    new Color([247, 34, 101, 0.9]),
                    1
                  ),
                  new Color([207, 34, 171, 0.5])
                );
                featLayer.setSelectionSymbol(symbol);

                //make unselected features invisible
                var nullSymbol = new SimpleMarkerSymbol().setSize(0);
                featLayer.setRenderer(new SimpleRenderer(nullSymbol));
                curMap.addLayer(featLayer);

                featLayer.queryFeatures(query1, function (response) {
                    var feature;
                    var features = response.features;
                    //alert(features.length + " features");
                    var inBuffer = [];
                    //filter out features that are not actually in buffer, since we got all points in the buffer's bounding box
                    for (var i = 0; i < features.length; i++) {
                        feature = features[i];
                        if (circle.contains(feature.geometry)) {
                            inBuffer.push(feature.attributes[featLayer.objectIdField]);
                        }
                    }

                    //alert(inBuffer.length);
                    var query = new Query();
                    query.objectIds = inBuffer;
                    query.returnGeometry = true;
                    query.outFields = ["*"];
                    //use a fast objectIds selection query (should not need to go to the server)
                    featLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function (results) {
                        //alert("Query Complete on " + featLayer.name);
                        var facilityName = organizeResults(results);
                        var r = "";

                        r = "<b>" + featLayer.name + "<i><div>" + facilityName + "</div></i></b>";
                        dom.byId("messages").innerHTML = dom.byId("messages").innerHTML + r;
                    }, function (e) {
                        alert(e);
                    });

                    function organizeResults(features) {
                        var popTotal = "";
                        for (var x = 0; x < features.length; x++) {
                            popTotal = popTotal + "<div>" + features[x].attributes["Facility_Name"] + "</div>";
                        }
                        //alert(popTotal + "facility");
                        return popTotal;
                    }

                });

            }
        });

    },

    onOpen: function () {
        lChecked = [];
        selTool = this;
        curMap = this.map;
        //queryLayer = [];
        buffDist = dom.byId("sliderValue").value;

       

         this.map.on("click", this.mapClick);

         

        //setup check boxes
       /* var checkBox = new CheckBox({
            name: "checkBox",
            value: "0",
            checked: false,
            onChange: function (b) {
                //alert('onChange called with parameter = ' + b + ', and widget value = ' + this.get('value')); 
                var Furl;
                if (this.get('checked') == true) {
                     Furl = "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/12";
                }
                queryLayer[0] = Furl;
            }
        }, "checkBox0").startup();

        var checkBox1 = new CheckBox({
            name: "checkBox1",
            value: "1",
            checked: false,
            onChange: function (b) {
                //alert('onChange called with parameter = ' + b + ', and widget value = ' + this.get('value'));
                var Furl;
                if (this.get('checked') == true) {
                    Furl = "http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/15";
                }
                queryLayer[1] = Furl;
            }
        }, "checkBox1").startup();*/

        //alert("buffer dist  " + buffDist);

        //var slayers = this.map.layerIds;
        //var dmapService = this.map.getLayer(slayers[1]);
        //var visLayers = dmapService.visibleLayers;

        //alert(dmapService.layerInfos[0].subLayerIds);
        //alert(dmapService.visibleLayers);  
        
        //visLayers.forEach(callme);

        //function callme(value) {
        //    alert(value);
        //}
        //var featureLayer = new FeatureLayer("http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/15", {
        //    //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
        //    outFields: ["Facility_Name"]
        //});  //dmapService.layerInfos.length
        

        //SelectBuffer
        //var sBuff = new selectBuffer();
        //sBuff.eventSetup(this.map);

        //var slayers = thisMap.layerIds;
        //var dmapService = thisMap.getLayer(slayers[1]);
        //var visLayers = dmapService.visibleLayers;

        //visLayers.forEach(callme);

        //function callme(value) {

        //}

            
        //    sBuff.eventSetup(this.map, featureLayer);
        //}

        //var sBuff = new selectBuffer();
        //sBuff.eventSetup(this.map, featureLayer);

        ////Selected feature symbol
        //var symbol = new SimpleMarkerSymbol(
        //  SimpleMarkerSymbol.STYLE_CIRCLE,
        //  18,
        //  new SimpleLineSymbol(
        //    SimpleLineSymbol.STYLE_NULL,
        //    new Color([247, 34, 101, 0.9]),
        //    1
        //  ),
        //  //new Color([207, 34, 171, 0.5])
        //    new Color([255, 0, 0, 0.5])
        //);
        //featureLayer.setSelectionSymbol(symbol);

        ////make unselected features invisible
        //var nullSymbol = new SimpleMarkerSymbol().setSize(0);
        //featureLayer.setRenderer(new SimpleRenderer(nullSymbol));

        //this.map.addLayer(featureLayer);

        
      console.log('onOpen');
    },

    onClose: function(){
      dom.byId("messages").innerHTML = "";
      //dom.byId("layer_list").innerHTML = "";

      for(var i=0; i<featLayerList.length; i++){
        featLayerList[i].clearSelection();
        curMap.removeLayer(featLayerList[i]);
      }
       featLayerList = [];
       featLayerIndex = 0;
      //alert(featLayerList[0].clearSelection());
       curMap.graphics.clear()
      // lChecked = [];
       //remove onclicks
       this.map.on("click", ' ');
       

      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});