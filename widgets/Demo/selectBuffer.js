define(["dojo/_base/declare", "dojo/dom", "dojo/_base/array", "dojo/_base/lang", "esri/map", "esri/dijit/Geocoder",
    "esri/layers/FeatureLayer", "esri/tasks/query", "esri/geometry/Circle",
    "esri/graphic", "esri/InfoTemplate", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/renderers/SimpleRenderer",
    "esri/config", "esri/Color"
], function (declare, dom, array, lang, Map, Geocoder, FeatureLayer, Query, Circle, Graphic, InfoTemplate, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, SimpleRenderer, config, Color) { //These variables MUST be in the same order as the require statements that they reference

    var thisMap;
    //var fLayer;
    var fLayer = new FeatureLayer("https://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/12", {
        //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
        outFields: ["Facility_Name"]
    });
    //var fLayer2 = new FeatureLayer("http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/15", {
    //    //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
    //    outFields: ["Facility_Name"]
    //});
    var selObject;
    //var qLayers;
    

    return declare([], {
        mapClick: function (evt) {

            alert("Map click");
            var point = evt.mapPoint;
            //alert(visLayers);


            //var featLayer = new FeatureLayer("http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/12", {
            //    //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
            //    outFields: ["Facility_Name"]
            //});

            //var featLayer2 = new FeatureLayer("http://geoapps64.main.ad.rit.edu:6080/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/12", {
            //    //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
            //    outFields: ["Facility_Name"]
            //});
            //fLayer = featLayer;
            //Selected feature symbol
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
            //featLayer.setSelectionSymbol(symbol);

            ////make unselected features invisible
            //var nullSymbol = new SimpleMarkerSymbol().setSize(0);
            //featLayer.setRenderer(new SimpleRenderer(nullSymbol));

            //thisMap.addLayer(featLayer);

            selObject.plotPoint(point); 
            selObject.showBuffer(point, fLayer);  
            //selObject.showBuffer(point, featLayer2);
        },
        geocodeSelect: function (evt) {
            alert("geocoded");
            var point = evt.result.feature.geometry;
            this.plotPoint(point);
            //showBuffer();
        },
        
        eventSetup: function (map) {

            selObject = this;
            thisMap = map;
            //qLayers = queryLayers;
            //alert(queryLayers[0].url);
            //fLayer = featureLayer;
            //vLayers = visLayers;
            //alert(visLayers);
            //Setup map click event
            map.on("click", this.mapClick);

            //Setup geocode event
            var geocoder = new Geocoder({
                arcgisGeocoder: {
                    placeholder: "Find a place"
                },
                autoComplete: true,
                map: map
            }, dom.byId("search"));

            //on select event for geocoding
            geocoder.on("select", this.geocodeSelect);

        },
        plotPoint: function (point) {
            //map.graphics.clear();
            var symbol = new SimpleMarkerSymbol().setStyle(
              SimpleMarkerSymbol.STYLE_SQUARE).setColor(
              new Color([255, 0, 0, 0.5])
            );
            var graphic = new Graphic(point, symbol);
            thisMap.graphics.add(graphic);

            //selObject.showBuffer(point);
        },
        showBuffer: function (point, fLayer) {

            var circleSymb = new SimpleFillSymbol(
              SimpleFillSymbol.STYLE_NULL,
              new SimpleLineSymbol(
                SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
                new Color([105, 105, 105]),
                2
              ), new Color([255, 255, 0, 0.25])
            );

            alert("do buffer");
            circle = new Circle({
                center: point,
                geodesic: true,
                radius: 3,
                radiusUnit: "esriMiles"
            });
            //thisMap.graphics.clear();
            thisMap.infoWindow.hide();
            var graphic = new Graphic(circle, circleSymb);
            thisMap.graphics.add(graphic);
           
            var query1 = new Query();
            query1.geometry = circle.getExtent();

            //use a fast bounding box query. will only go to the server if bounding box is outside of the visible map
           
            fLayer.queryFeatures(query1, selObject.selectInBuffer);
            
            //function selectInBuffer(response) {
            //    var feature;
            //    var features = response.features;
            //    var inBuffer = [];
            //    alert(features.length + " features");
            //    //filter out features that are not actually in buffer, since we got all points in the buffer's bounding box
            //    for (var i = 0; i < features.length; i++) {
            //        feature = features[i];
            //        if (circle.contains(feature.geometry)) {
            //            inBuffer.push(feature.attributes[fLayer.objectIdField]);
            //        }
            //    }
            //    var query = new Query();
            //    query.objectIds = inBuffer;
                
            //    //use a fast objectIds selection query (should not need to go to the server)
            //    fLayer.selectFeatures(query, fLayer.SELECTION_NEW, function (results) {
            //        alert("hello2");
            //        var facilityName = organizeResults(results); //sumPopulation(results);
            //        var r = "";

            //        r = "<b>" + fLayer.name + "<i><div>" + facilityName + "</div></i></b>";
            //        dom.byId("messages").innerHTML = dom.byId("messages").innerHTML + r;
            //    });
                
            //    function organizeResults(features) {
            //        var popTotal = "";
            //        for (var x = 0; x < features.length; x++) {
            //            popTotal = popTotal + features[x].attributes["Facility_Name"];
            //        }
            //        alert(popTotal + "facility");
            //        return popTotal;
            //    }
            //}
            
        },
        selectInBuffer: function (response) {

            var feature;
            var features = response.features;
            var inBuffer = [];
            //alert(features.length + " features");
            //filter out features that are not actually in buffer, since we got all points in the buffer's bounding box
            for (var i = 0; i < features.length; i++) {
                feature = features[i];
                if (circle.contains(feature.geometry)) {
                    inBuffer.push(feature.attributes[fLayer.objectIdField]);
                }
            }
            var query = new Query();
            query.objectIds = inBuffer;
            //use a fast objectIds selection query (should not need to go to the server)
            fLayer.selectFeatures(query, fLayer.SELECTION_NEW, function (results) {
                var facilityName = selObject.organizeResults(results); //sumPopulation(results);
                var r = "";
                
                r = "<b>" + fLayer.name + "<i><div>" + facilityName + "</div></i></b>";
                dom.byId("messages").innerHTML = dom.byId("messages").innerHTML + r;
            });
        },
        organizeResults: function (features) {
            var popTotal = "";
            for (var x = 0; x < features.length; x++) {
                popTotal = popTotal + features[x].attributes["Facility_Name"];
            }
            alert(popTotal + "facility");
            return popTotal;
        },
        SomeProperty2: {
            
        },
        SomeProperty1: {
            //TODO
        }
    });
});
