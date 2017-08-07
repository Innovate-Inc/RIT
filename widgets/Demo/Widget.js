define(['dojo/dom','dojo/_base/declare', 'jimu/BaseWidget', "esri/map", "dgrid/OnDemandGrid", "dgrid/Selection", "dojo/store/Memory", "dojo/_base/array", "esri/dijit/Geocoder", "dijit/form/HorizontalSlider",
    "esri/layers/FeatureLayer", "esri/tasks/query", "dojo/query", "esri/geometry/Circle",
    "esri/graphic", "esri/InfoTemplate", "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/renderers/SimpleRenderer",
    "esri/config", "esri/Color", "dojo/dom", "dojo/dom-construct", "dojo/dom-style", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/layers/LayerInfo", "dijit/form/CheckBox", "dojo/_base/array", "dojo/on"],
function (dom, declare, BaseWidget, sMap, Grid, Selection, Memory, array, Geocoder, HorizontalSlider, FeatureLayer, Query, query, Circle, Graphic, InfoTemplate, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, SimpleRenderer, config, Color, dom, domConstruct, domStyle, ArcGISDynamicMapServiceLayer, LayerInfo, CheckBox, arrayUtils, on) {
    //To create a widget, you need to derive from BaseWidget.
    
    //var queryLayer;
    var curMap;
    var selTool;
    var buffDist;  //Search Distance
    var wasteValue; //Search waste value
    var wasteLogic = '>=';
    var lChecked = []; //Layers that are checked
    //var query = new Query();
    var featLayerList = [];
    var featLayerIndex =0;
    var goecoder;
    var mapClickHandler;
    var subCatObject = {};
    //var csvCAFO = new Array;
    //var csvHospitality = new Array;

    return declare([BaseWidget], {
    // DemoWidget code goes here 

    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);

      //setting up store arrays
       // fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Mature_Dairy_Cattle', 'Heifers', 'Veal_Cattle', 'Other_Cattle', 'Swine_55_Up', 'Swine_55_Down', 'Horses', 'Sheep_Lamb', 'Turkeys', 'Broilers', 'Layers', 'Ducks', 'Other', 'Est_Manure_MT_yr', 'Type_'];
        //csvCAFO.push(fieldnames);
        curMap = this.map;
      self = this;
        totalResults = 0;
      //Setup geocode event
        geocoder = new Geocoder({
            arcgisGeocoder: {
                placeholder: "Find a place",
                sourceCountry: "US"
            },
            autoComplete: true,
            map: this.map
        }, dom.byId("search"));
        geocoder.startup();
      //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
        //on select event for geocoding
        geocoder.on("select", this.geocodeSelect);

        //set up download button
        var downloadBtn = dom.byId("btnDLResults");
        on(downloadBtn, 'click', this._prepDataForDownload);

        //geocoder.on("clear", this.clearSearch);

        //button onClicks
        //on(dom.byId("btnClear"), 'click', this.clearSearch);
        on(btnClear, 'click', function(){
           console.log("clear amp");

            //Clear previous search
            for(var i=0; i<featLayerList.length; i++){
                featLayerList[i].clearSelection();
                curMap.removeLayer(featLayerList[i]);
            }
            curMap.graphics.clear();
            dojo.style("downloadLbl", "visibility", "hidden"); //grid  downloads
            dojo.style("grid", "visibility", "hidden");
            dojo.style("downloads", "visibility", "hidden");
        });
        //on(btnSearch, 'click', function(){
        //    //highlight symbol
        //
        //    geocoder.select();
        //    //geocoder.focus();
        //    //geocoder.find().then(function(results){
        //    geocoder.searchDelay = 300;
        //    geocoder.select(geocoder.results[0]);
        //
        //    //});
        //});

      console.log('startup');


        //add slider widget
        slider = new HorizontalSlider({
            name: "slider",
            value: 5,
            minimum: 1,
            maximum: 250,
            discreteValues: 250,
            intermediateChanges: false,
            style: "width:300px;",
            onChange: function (value) {
                dom.byId("sliderValue").value = value;
                buffDist = value;
                //alert(buffDist);
            }
        }, "slider").startup();

        var distText = dom.byId("sliderValue");
        on(distText, "input", function(){
            if(distText.value <= 250){
                dijit.byId("slider").set("value", distText.value);
            }else{
                dijit.byId("slider").set("value", 250);
            }
        });

        //Estimated Waste Slider
        wasteSlider = new HorizontalSlider({
            name: "estimatedWaste",
            value: 0,
            minimum: 1,
            maximum: 250,
            discreteValues: 250,
            intermediateChanges: false,
            style: "width:300px;",
            onChange: function (value) {
                dom.byId("wasteSliderValue").value = value;
                wasteValue = value;

            }
        }, "wasteSlider").startup();

        var estimatedWasteText = dom.byId("wasteSliderValue");
        on(estimatedWasteText, "input", function(){
            if(distText.value <= 250){
                dijit.byId("wasteSlider").set("value", estimatedWasteText.value);
            }else{
                dijit.byId("wasteSlider").set("value", 250);
            }
        });
        //Get value from waste logic dropdown
        var estimatedWasteLogic = dom.byId("estimatedWasteSelect");
        on(estimatedWasteLogic, "change", function(evt){
            console.log(evt.target.value);
            wasteLogic = evt.target.value;
        });



         //Layer List
        var visible = [];
        subCats = [];
        var layer = curMap.getLayer("P2I_web_service_2015_retail_2266");
        //alert(curMap.layerIds[1]);
        var items = arrayUtils.map(layer.layerInfos, function(info, index) {
            /*if (info.defaultVisibility) {
              visible.push(info.id);
            }*/
             //lChecked = visible;
            //alert(info.parentLayerId);
            if(info.parentLayerId == -1){
                subCats.push(info.name);
                subCatObject[info.name] = [];
                if(!!info.subLayerIds) {

                    return "<div ><input type='checkbox' style='margin-right: 5px' class='group_layer'" + "' id='" + info.id + "' /><label for='" + info.id + "'>" + info.name + "</label></div>";
                } else{
                    return "<div><input type='checkbox' style='margin-right: 5px' class='list_item'" + "' id='" + info.id + "' /><label for='" + info.id + "'>" + info.name + "</label></div>";
                }
               //return "<div><input type='checkbox' class='list_item'" + (info.defaultVisibility ? "checked=checked" : "") + "' id='" + info.id + "'' /><label for='" + info.id + "'>" + info.name + "</label></div>";
               //return "<div>"+ info.name +"</div>";
            }
            return  "<div class='sub_layer' style='display: none'><input type='checkbox' style='margin-right: 5px' class='list_item'"  + "' id='" + info.id + "'' /><label for='" + info.id + "'>" + info.name + "</label></div>";

          });

        //prepare an array for each subCat to store result for download
        this._prepareSubCatArrays;


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
            }
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
            layer.setVisibleLayers(visible);
            self._wasteFilterVisibility(visible, layer);

        }
        //End LayerLise
         
    },

    _wasteFilterVisibility: function(visible, layer){
        var wasteFilterLayers = self.config.wasterFilterLayers;
        var fiterVisible = false;
        if(visible.length > 0 && visible[0] != -1){
            visible.forEach(function(id){

                if(wasteFilterLayers.includes(layer.layerInfos[id].name)){
                    console.log("yep, make filter visible");
                    dojo.style("wasteFilter", "display", "block");
                    fiterVisible = true;
                }else{
                    dojo.style("wasteFilter", "display", "none");
                }
            });
        }
        if(!fiterVisible){
            dojo.style("wasteFilter", "display", "none");
        }
    },

    clearSearch: function(){
        console.log("Clear Search");
        geocoder.clear();
        slider.set('value', 5);
        wasteSlider.set('value', 5);
        //geocoder.destroy();

    },

    mapClick: function (evt) {

    },

    selectInBuffer: function (response) {
        //var feature;
        //var features = response.features;
        //alert(features.length + " features");
    },

    geocodeSelect: function (evt) {

        //Clear current Lists
        subCats.forEach(function(sb, index, array){
            if(subCatObject[sb].length > 0){
                subCatObject[sb] = [];
            }
        });

        //keep adding to get total results
        totalResults = 0;

        //Clear previous search
        for(var i=0; i<featLayerList.length; i++){
            featLayerList[i].clearSelection();
            curMap.removeLayer(featLayerList[i]);
        }

        featLayerList = [];
        featLayerIndex = 0;
        curMap.graphics.clear();
        dom.byId("downloads").innerHTML = "";
        dom.byId("grid").innerHTML = "";
        var fullList = [];
        //check for selected layers
        //alert( "layer" + " " + lChecked);
        if(lChecked < 1){
            alert("Please choose a layer to select from");
            return;
        }
        //get point where mouse clicked
        var point = evt.result.feature.geometry;
        //Clear graphics on map and add graphic where user clicked

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
        //set waste filter
        var wasteStatus = domStyle.get("wasteFilter", "display");
        if(wasteStatus == 'block'){
            query1.where = "Est_Waste_Ton_wk" + " " + wasteLogic + " " + dom.byId("wasteSliderValue").value;
            console.log( query1.where);
        }

        //query1.geometry = circle.getExtent();
        query1.geometry = graphic.geometry;
        //Add waste value to look for


        //zoom map to radius extent
        curMap.setExtent(circle.getExtent(), true);

        //use a fast bounding box query. will only go to the server if bounding box is outside of the visible map
        //fLayer.queryFeatures(query1, selObject.selectInBuffer);

        //Add results to the grid
        var grid = new (declare([Grid, Selection]))({
            bufferRows: Infinity,
            columns:{
                "id": "ID",
                "Name": "Facility Name",
                "type": "Type",
                "layer": "Layer"
            } }, "grid");
        grid.styleColumn("id", "display: none;");
        grid.styleColumn("layer", "display: none;");

        var layer = curMap.getLayer("P2I_web_service_2015_retail_2266");
        //alert(layer.layerInfos[0].name);

        //loop through each layer that was checked
        lChecked.forEach(function (element, index, array) {
            //
        setTimeout(function(){
            var template = new InfoTemplate();
            template.setTitle("<b>${Type_}</b>");
            template.setContent("<b>Facility Name: ${Facility_Name}</b></br>"
                + "<b>Address: ${Address}</b></br>"
                + "<b>${City}, ${State} ${ZIP}</b></br>"
                //+ "<b>Facility Name: ${City}</b>"
                //+ "<b>Facility Name: ${City}</b>"
            );
            //template.setContent(getTextContent);
            //alert(element);

            var featLayer;
            if (element !== undefined) {
                //Get Parent layer name - group layer
                var parent = layer.layerInfos[element].parentLayerId;
                var pName = "";
                if(parent != -1){
                    pName = layer.layerInfos[parent].name;
                }else{
                    pName = layer.layerInfos[element].name;
                }
                //create layer
                featLayer = new FeatureLayer("https://geoapps64.main.ad.rit.edu:6443/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/"+element, {
                    //infoTemplate: new InfoTemplate("Block: ${BLOCK}", "${*}"),
                    id: layer.layerInfos[element].name + "_" + pName ,
                    //infoTemplate: template,
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: ["*"]
                });
                //alert(element + " " + featLayer.id);
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
                console.log('Q Isues');
                //make unselected features invisible
                var nullSymbol = new SimpleMarkerSymbol().setSize(0);
                featLayer.setRenderer(new SimpleRenderer(nullSymbol));
                curMap.addLayer(featLayer);

                featLayer.selectFeatures(query1, FeatureLayer.SELECTION_NEW, function (response) {
                    var feature;

                    var features = response.features;
                    console.log('Q Isues');
                    facilityName = organizeResults(response);
                    //alert(facilityName.length);
                    fullList = fullList.concat(facilityName);
                    //alert(fullList.length);

                    var memStore = new Memory({data: fullList});
                    grid.set("store", memStore);

                    if(facilityName.length > 0){
                        window.setTimeout(createCSV(featLayer, response),1000);
                        //createCSV(featLayer, response);
                    };

                    function organizeResults(features) {
                        //alert(featLayer.id + " Organzed");
                        var popTotal = "";
                        var list = [];
                        for (var x = 0; x < features.length; x++) {
                            popTotal = popTotal + "<div><p id='resultlListd'>" + features[x].attributes["Facility_Name"] + "</p></div>";
                            list[x] = {
                                "id": features[x].attributes["OBJECTID"],
                                "Name": features[x].attributes["Facility_Name"],
                                "type": features[x].attributes["Type_"],
                                "layer": features[x]._layer.id
                            };
                        }

                        //popTotal = popTotal + "</ul>";
                        //alert(popTotal + "facility");
                        //return popTotal;
                        return list;
                    }
                    //}
                });

            }
            if(curMap.extent != circle.getExtent()){
                //zoom map to radius extent
                curMap.setExtent(circle.getExtent(), true);
            }
        },1000);
        },function(){
            alert("here");

        });

        console.log("this is here");
        // add a click listener on the ID column
        //grid.on(".field-id:click", selectState);
        grid.on(".dgrid-row:click", selectState);
        //
        function selectState(e) {
            //clear selection on featurelayers
            for(var i=0; i<featLayerList.length; i++){
                featLayerList[i].clearSelection();
            }
            curMap.infoWindow.hide();
            var row = grid.row(event);

            //alert(row.data["layer"]);
            var fl = curMap.getLayer(row.data["layer"]);

            //alert(curMap.graphicsLayerIds + " " + row.data["type"]);
            var query = new Query();
            query.objectIds = [row.id];

            //query.objectIds = [parseInt(e.target.innerHTML, 10)];
            fl.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(result) {
                if ( result.length ) {
                    // re-center the map to the selected feature
                    //curMap.centerAt(result[0].geometry);
                    //curMap.infoWindow.setFeatures(result);//result[0].geometry;
                    //curMap.infoWindow.show(result[0].geometry);
                    curMap.centerAt(result[0].geometry);
                } else {
                    console.log("Feature Layer query returned no features... ", result);
                }
            });
        }

        function createCSV(fLayer, results){

            //get field names
            var featFieldNames = fLayer.fields;
            var fieldnames = [];

            var layID = fLayer.id.split('_');

            if(layID[1] == 'CAFO'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Mature_Dairy_Cattle', 'Heifers', 'Veal_Cattle', 'Other_Cattle', 'Swine_55_Up', 'Swine_55_Down', 'Horses', 'Sheep_Lamb', 'Turkeys', 'Broilers', 'Layers', 'Ducks', 'Other', 'Est_Manure_MT_yr', 'Type_'];
            }else if(layID[1] == 'Event Venues & Resorts'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Website', 'Estimated_Food_Waste_MT_yr', 'Type_'];
            }else if(layID[1] == 'Food Processors'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Type_'];
            }else if(layID[1] == 'Institutions'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Telephone', 'Est_Waste_Ton_wk', 'Type_'];
            }else if(layID[1] == 'Restaurants'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Est_Waste_tons_wk', 'Type_'];
            }else if(layID[1] == 'Retail'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Website', 'Est__Waste_Ton_wk', 'Type_'];
            }else if(layID[1] == 'Anaerobic Digesters'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Digester_Type', 'Biogas_Use', 'Co_Digestion', 'Capacity', 'Farm_Type', 'Type_'];
            }else if(layID[1] == 'BUD'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Waste_Types', 'Beneficial_Use', 'Type_'];
            }else if(layID[1] == 'Compost Sites'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Website', 'Major_Feedstock', 'Owner', 'Tipping_Fee', 'Type_'];
            }else if(layID[1] == 'Food Banks'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Pounds_Distributed_Annually', 'Type_'];
            }else if(layID[1] == 'Grease Trap Waste'){
                fieldnames = ['Facility_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Waste_Accepted', 'Type_'];
            }else if(layID[1] == 'Hospitality'){
                fieldnames = ['Company_Name', 'Address', 'City', 'State', 'ZIP', 'County', 'Phone_Number_Combined', 'Type_', 'Est_food_t_wk'];
            }else{
                fLayer.fields.forEach(function (item, index, array) {
                    fieldnames.push(item.name);
                });
            }
            subCatObject[layID[1]].push(fieldnames);
            //prepare CSV data
            // var csvData = new Array();
            // csvData.push(fieldnames);

            //Load data into array
            results.forEach(function (item, index, array) {
                //alert(item.OBJECTID);
                var data = "";
                for (var i = 0; i < fieldnames.length; i++) {
                    data = data + '"' + item.attributes[fieldnames[i]] + '",'
                }
                //csvData.push(data);
                subCatObject[layID[1]].push(data);
            });

            // // put data array into file, name file and attach to link
            // var fileName =  layID[0] + ".csv";
            // var buffer = csvData.join("\n");
            // var blob = new Blob([buffer], {
            //     "type": "text/csv;charset=utf8;"
            // });
            // var ddiv = document.createElement("div");
            // var link = document.createElement("a");
            //
            // if (link.download !== undefined) { // feature detection
            //     // Browsers that support HTML5 download attribute
            //     link.setAttribute("href", window.URL.createObjectURL(blob));
            //     link.setAttribute("download", fileName);
            // }
            // else {
            //     // it needs to implement server side export
            //     link.setAttribute("href", "http://www.example.com/export");
            // }
            // link.innerHTML = "Export csv of " + fLayer.name + " (" + results.length + " Results)";
            //
            // var dd = dom.byId("downloads");
            //
            // ddiv.appendChild(link);
            // dd.appendChild(ddiv);
        }
        dojo.style("downloadLbl", "visibility", "visible");
        dojo.style("grid", "visibility", "visible");
    },
      //method to prepare objects to store subcat data
    _prepareSubCatArrays: function(catName, results, fieldnames){
        results.forEach(function (item, index, array) {
            var data = "";
            for (var i = 0; i < fieldnames.length; i++) {
                data = data + '"' + item.attributes[fieldnames[i]] + '",'
            }
            subCatObject[catName].push(data);
            //csvHospitality.push(data);
        });
    },

    _prepDataForDownload: function(){
        console.log("download has been clicked");
        console.log("This is CAFO", subCatObject);
        //console.log("This is Hospitality", csvHospitality);
        dom.byId("downloads").innerHTML = "";
       //loop through subcats and add results to UI
        subCats.forEach(function(sb, index, array){
            if(subCatObject[sb].length > 0){
                console.log("if this then create csv");

                // put data array into file, name file and attach to link
                var fileName =  sb + ".csv";
                var buffer = subCatObject[sb].join("\n");
                var blob = new Blob([buffer], {
                    "type": "text/csv;charset=utf8;"
                });
                var ddiv = document.createElement("div");
                var link = document.createElement("a");

                if (link.download !== undefined) { // feature detection
                    // Browsers that support HTML5 download attribute
                    link.setAttribute("href", window.URL.createObjectURL(blob));
                    link.setAttribute("download", fileName);
                }
                else {
                    // it needs to implement server side export
                    link.setAttribute("href", "http://www.example.com/export");
                }
                link.innerHTML = "Export csv of " + sb + " (" + subCatObject[sb].length + " Results)";

                var dd = dom.byId("downloads");

                ddiv.appendChild(link);
                dd.appendChild(ddiv);


            }
        });
        dojo.style("downloads", "visibility", "visible");
    },

    onOpen: function () {
        //lChecked = [];
        selTool = this;
        curMap = this.map;
        //queryLayer = [];
        buffDist = dom.byId("sliderValue").value;
        
      console.log('onOpen Demo');
    },

    onClose: function(){
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