define(['dojo/_base/declare', 'jimu/BaseWidget',
  "esri/request", "esri/map", "esri/layers/LayerInfo",
  "esri/layers/FeatureLayer", "esri/layers/ArcGISDynamicMapServiceLayer",
  "dojo/_base/array"],
function(declare, BaseWidget, esriRequest, Map, LayerInfo, FeatureLayer, ArcGISDynamicMapServiceLayer, arrayUtils) {
  //To create a widget, you need to derive from BaseWidget.
  var curMap;

  return declare([BaseWidget], {
    // DemoWidget code goes here 

    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',

    postCreate: function() {
      this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function() {
      this.inherited(arguments);
      // this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      console.log('startup');
    },

    onOpen: function(){
      
        curMap = this.map;
        var layer = curMap.getLayer("P2I_web_service_2015_retail_2266");
        var dItems = layer.layerInfos;
        //alert(dItems[0].name);


        //alert(layer);
        //Create Horizontal Legend
        var url = "https://geoapps64.main.ad.rit.edu:6443/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail/MapServer/legend" + "?f=pjson";
        var restEnd = "https://geoapps64.main.ad.rit.edu:6443/arcgis/rest/services/P2I_2015/P2I_web_service_2015_retail"
        //alert(currentObject.config.legend.url);
        var requestHandle = esriRequest({
            "url": url,
            "content": {
                "f": "json"
            },
            "callbackParamName": "callback"
        });

        requestHandle.then(requestSucceeded, requestFailed);

        function requestSucceeded(response, io) {
            //alert("Succeeded: " + response.layers[0]["legend"][0]["label"]);

            //alert(response.layers[1]["legend"][0]["url"]);
            var content = "<div class=\"innvateLegend\"><div><b>" + "</b></div><table>";
            var mLegend = response.layers[0]["legend"];
            var imgURL = "";
            var llIndex = 0;
            //alert(response.layers.length);
            
            for (var i = 0; i < dItems.length; i++) {

              var Lid = dItems[i].id;
              //alert(Lid);
              if(dItems[i].parentLayerId == -1){
                if(!!dItems[i].subLayerIds){
                  imgURL = restEnd + "/MapServer/"+ (Lid+1) +"/images/" + response.layers[llIndex+1]["legend"][0]["url"] ;
                  content = content + "<tr><td valign=\"middle\" align=\"center\"><div><img alt=\"\" src=\"" + imgURL + "\"></div></td>" +
                  "<td valign=\"middle\" align=\"left\" style=\"padding: 3px 10px 0px 5px\">" + dItems[i].name + "</td></tr>";
                  //content = content + "<tr><td valign=\"middle\" align=\"center\"><div>" + dItems[i].name + "</div></td>"

                }else{
                  imgURL = restEnd + "/MapServer/"+ Lid +"/images/" + response.layers[llIndex]["legend"][0]["url"] ;
                  content = content + "<tr><td valign=\"middle\" align=\"center\"><div><img alt=\"\" src=\"" + imgURL + "\"></div></td>" +
                    "<td valign=\"middle\" align=\"left\" style=\"padding: 3px 10px 0px 5px\">" + response.layers[llIndex]["layerName"] + "</td></tr>";
                    llIndex++;
                }
              }else{
                
                // imgURL = restEnd + "/MapServer/"+ Lid +"/images/" + response.layers[llIndex]["legend"][0]["url"] ;
                // //imgURL = restEnd + "/MapServer/"+ response.layers[i]["layerId"] +"/images/" + response.layers[i]["legend"][0]["url"] ;
                // content = content + "<tr><td valign=\"middle\" align=\"center\"><div><img alt=\"\" src=\"" + imgURL + "\"></div></td>" +
                //   "<td valign=\"middle\" align=\"left\" style=\"padding: 3px 10px 0px 5px\">" + response.layers[llIndex]["layerName"] + "</td></tr>";
                llIndex++;  
              }
              
            }
            // for (var i = 0; i < mLegend.length; i++) {
            //     imgURL = restEnd + "/MapServer/1/images/" + mLegend[i]["url"];
            //     alert(restEnd + "/MapServer/1/images/" + mLegend[i]["url"]);
            //     //alert(mLegend[i]["label"]);
            //     content = content + "<td valign=\"middle\" align=\"center\"><div><img alt=\"\" src=\"" + imgURL + "\"></div></td>" +
            //         "<td valign=\"middle\" align=\"left\" style=\"padding: 3px 20px 0px 5px\">" + mLegend[i]["label"] + "</td>";
            // }
            content = content + "</tbody></table></div>";
            //alert(content);
            var legendContainer = document.getElementById("legendDiv");
            legendContainer.innerHTML = content;
            //$(legendContainer).append(content);

        }
        function requestFailed(error, io) {
            alert("Failed");
        }
        //End Legend

      console.log('onOpen');
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