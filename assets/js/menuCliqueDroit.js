
//ICON DE LA RUBRIQUE RAFRAICHIR

var refresh_icon = 'assets/img/refresh-64.png';
var pois_icon = 'assets/img/poi-64.png';
var center_icon = 'assets/img/pointeur.png';
var toHere_icon = 'assets/img/to-64.png';
var fromHere_icon = 'assets/img/from-64.png';
var directions_icon ='assets/img/directions-64.png';
var direction_mode='pieton';
var direction_geojsonFormat = new ol.format.GeoJSON();

 //MENU 

 var contextmenu_items = [
    {
        text: 'Direction',
        icon: directions_icon,
        items: [
          {
            text: 'A partir d\'ici',
            icon: fromHere_icon,
            callback: roadFromHere
          },
          {
            text: 'Vers ici',
            icon: toHere_icon,
            callback: roadToHere
          }
        ]
    },
    {
        text: 'Centrer la carte ici',
        classname: 'bold',
        icon: center_icon,
        callback: center
      },
     
    {
        text: 'Couche d\'intérêt à proximité',
        classname: 'bold',
        icon: pois_icon,
        callback: nearbyPoisContexteMenu
    },
    {
        text: 'Rafraichir la carte',
        icon: refresh_icon,
        callback: reloadMap
    },
    '-'   
    ];

    var contextmenu = new ContextMenu({
        width: 210,
        items: contextmenu_items
    });
    map.addControl(contextmenu);


    //FONCTION DU CALLBACK DE LA RUBRIQUE RAFRAICHIR 

    function roadFromHere(obj){
        $("#find_location_map_content").hide();
        $("#nearby_pois_map_content").hide();
        $("#direction_road_map_content").show();
        var c = ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326');
        getSelectedAddressRoad('Wher you clicked: Start', c[0], c[1], 'start_location_suggestion_list','start_location_input', 'start');
    }
    
    function roadToHere(obj){
				$("#find_location_map_content").hide();
				$("#nearby_pois_map_content").hide();
				$("#direction_road_map_content").show();
				var c = ol.proj.transform(obj.coordinate, 'EPSG:3857', 'EPSG:4326');
				getSelectedAddressRoad('Wher you clicked: Destination', c[0], c[1], 'destination_suggestion_list','destination_input', 'destination');

            }
    
            var direction_start_popup = new ol.Overlay.Popup (
                {	popupClass: "black", //"tooltips", "warning" "black" "default", "tips", "shadow",
                    closeBox: false,
                    onclose: function(){ console.log("You close the box"); },
                    positioning: 'bottom-center',
                    autoPan: true,
                    autoPanAnimation: { duration: 100 }
                });
                var direction_destination_popup = new ol.Overlay.Popup (
                    {	
                        popupClass: "default anim", //"tooltips", "warning" "black" "default", "tips", "shadow",
                        closeBox: false,
                        onclose: function(){ console.log("You close the box"); },
                        positioning: 'bottom-center',
                        autoPan: true,
                        autoPanAnimation: { duration: 100 }
                    });
    
    var direction_styleFunction = function(feature, resolution) {
				var direction_Style = {
				   
				    'LineString': [new ol.style.Style({
				        stroke: new ol.style.Stroke({
				        color: [255, 255, 255, 0.5],
				        width: 5
				        }),zIndex:2
				   	}), new ol.style.Style({
						stroke: new ol.style.Stroke({
					  	color: [255, 0, 0, 0.8],
					  	width: 8
						}),
						zIndex: 1
					})],
				    'MultiLineString': [new ol.style.Style({
				        stroke: new ol.style.Stroke({
				        color: [255, 255, 255, 0.5],
				        width: 5
				        }),zIndex:2
				   	}), new ol.style.Style({
						stroke: new ol.style.Stroke({
					  	color: [255, 0, 0, 0.8],
					  	width: 8
						}),
						zIndex: 1
					})]
				};
				return direction_Style[feature.getGeometry().getType()];
			};

        
    var directionGeometryVector = new ol.layer.Vector(
				{	
					name: 'RoadDirection',
					source: new ol.source.Vector(),
					style: direction_styleFunction
                }); 
                
    function getSelectedAddressRoad(name, longitude, latitude, id_ul,id_input, type){
				name=name.replace(/[|]/g, "'");
				directionGeometryVector.getSource().forEachFeature(function(feature) {
		          	var typ = feature.get('type');
		          	if (typ==type) {
		          		directionGeometryVector.getSource().removeFeature(feature);
		          	}
		        });
				if(type=='start'){
					direction_start_popup.hide(undefined, ''); 
					var point_pos_search_inp = new ol.geom.Point(
						ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857')
					);
					var point_position_map_road_direction = new ol.Feature(point_pos_search_inp);
					point_position_map_road_direction.set('type','start');
					point_position_map_road_direction.set('image','assets/images/pois.png');
					directionGeometryVector.getSource().addFeature(point_position_map_road_direction);
					direction_start_popup.show(point_position_map_road_direction.getGeometry().getCoordinates(), '<i class="icon-text_format"></i>| '+name); 
				}else{
					direction_destination_popup.hide(undefined, ''); 
					var point_pos_search_inp = new ol.geom.Point(
						ol.proj.transform([longitude,latitude], 'EPSG:4326', 'EPSG:3857')
					);
					var point_position_map_road_direction = new ol.Feature(point_pos_search_inp);
					point_position_map_road_direction.set('type','destination');
					point_position_map_road_direction.set('image','assets/images/pois.png');
					directionGeometryVector.getSource().addFeature(point_position_map_road_direction);
					direction_destination_popup.show(point_position_map_road_direction.getGeometry().getCoordinates(), '<i class="icon-format_bold"></i>| '+name); 
				}
				
				$("#"+id_input).val(name);
				$("#"+id_ul).hide();
				
				var extent = directionGeometryVector.getSource().getExtent();
		        map.getView().fit(extent, map.getSize());

		        executeRoadMap();
            }

            function executeRoadMap(){
				if(directionGeometryVector.getSource().getFeatures().length > 1){
					var coordStart, coordDestination;
					directionGeometryVector.getSource().forEachFeature(function(feature) {
			          	var typ = feature.get('type');
			          	if (typ=='start') {
			          		coordStart = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
			          		
			          	}else if(typ=='destination'){
			          		
			          		coordDestination = ol.proj.transform(feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
			          	}
			        });

			        directionGetRoadDirection(coordStart, coordDestination,direction_mode, 'service', true, 'road_map_tab');
				}
			}

            // map.addLayer(directionGeometryVector);
			// map.addOverlay(direction_start_popup);
			// map.addOverlay(direction_destination_popup);
       

			function directionGetRoadDirection(start, destination,mode, service, roadmap, id_roadmap_content){
		
				$.ajax({
					url: 'http://www.navcities.com/api/routing/?&user=demo&txtstartpoint=your_start_adresse&txtendpoint=your_end_adresse&hwy=0&tr=0&piste=0',
					data:{
						startpoint 	: start[0]+','+start[1],
						finalpoint 	: destination[0]+','+destination[1],
						mode 		: mode
					},
					type: 'GET',
					dataType: 'JSON',
					async: false,
					cache: false,
					timeout: 10000,
					success: function(result) {
						directionGeometryVector.getSource().forEachFeature(function(feature) {
							if(feature.getGeometry().getType()!='Point'){
								directionGeometryVector.getSource().removeFeature(feature);
							}
						});
						//directionGeometryVector.getSource().clear();
						var features = direction_geojsonFormat.readFeatures(result,{featureProjection: 'EPSG:3857'});
		                directionGeometryVector.getSource().addFeatures(features);
		                    
					},
					error: function(){
						displayNotificationsAlerts('Road Map Direction','<p style="text-align: left !important">Erreur de calcul, données incomplètes.. !</p>','alert.png','3000');
					},
					complete: function(){
						var extent = directionGeometryVector.getSource().getExtent();
		                map.getView().fit(extent, map.getSize());
		                if(roadmap){
		                	mapRoadDirectionGetRoadMap(start, destination, mode, service,id_roadmap_content);
		                }  
					}
				});	
            }
            
            function activatePoisTab(a){
				$(a).click();
			}
            
      function elastic(t) {
        return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
      }
      
      function center(obj) {
        view.animate({
          duration: 700,
          easing: elastic,
          center: obj.coordinate
        });
      }
      
      function mapRoadDirectionGetRoadMap(start, destination,mode, service, id_roadmap_content){
        $("#"+id_roadmap_content).empty();
        $("#"+id_roadmap_content).append('<p><h3> Loading ... </h3></p>');
        activatePoisTab('a_road_map_tab');
        $.ajax({
            url: 'http://www.navcities.com/api/routing/roadmap.php?tr=0&piste=0&hwy=0&txtstartpoint=&txtendpoint=&user=userkey',
            data:{
                startpoint 	: start[0]+','+start[1],
                finalpoint 	: destination[0]+','+destination[1],
                mode 		: mode
            },
            type: 'GET',
            dataType: 'html',
            /*async: false,
            cache: false,
            timeout: 3000,*/
            success: function(result) {
                $("#"+id_roadmap_content).empty();
                $("#"+id_roadmap_content).append(result);
            },
            error: function(){
                displayNotificationsAlerts('Road Map','<p style="text-align: left !important">Erreur de calcul de feuille de route, données incomplètes.. !</p>','alert.png','3000');
            },
            complete: function(){
                $("#main_pois_list_content").show();
                $('.pois-toggle').removeClass('close').addClass('open');
                $('.pois-toggle').empty();
                $('.pois-toggle').append('<i class="icon-chevron-thin-right"></i>');
            }
        });	
    }
        
        function reloadMap(obj){
            location.reload();
        }
        
       
        function removePoisFeatures(categorie){
            nearbyPoisGeometryVector.getSource().forEachFeature(function(feature) {
                if(feature.get('souscategorie') == categorie){
                    nearbyPoisGeometryVector.getSource().removeFeature(feature); 
                }
            });
            $("#nearby_pois_count").empty();
            $("#nearby_pois_count").append(nearbyPoisGeometryVector.getSource().getFeatures().length +' POIS');
        }
        
        function zoomToPoi(nom, coord0, coord1, el){
            nearbyPoisGeometryVector.getSource().forEachFeature(function(feature) {
                  var name = feature.get('nom').replace(/[']/g, "|");
                  var cx = feature.get('x');
                  var cy = feature.get('y');
                  if (name==nom && cx== coord0 && cy==coord1) {
                      var ext=feature.getGeometry().getExtent();
                    map.getView().fit(ext, map.getSize());
                    var coordinates = ol.proj.transform([Number(feature.get('x')),Number(feature.get('y'))], 'EPSG:4326', 'EPSG:3857');
                    poi_popup.show(feature.getGeometry().getCoordinates(), name);
                    map.getView().setZoom(17);
                  }
            });
            removeActiveClass();
            $(el).addClass("active");
        }


    function nearbyPoisContexteMenu(obj){
        getNearbyPoisPopup('Where you clicked', obj.coordinate[0], obj.coordinate[1]);
        //COUCHE DES ECOLES
        changerClasseCss("listeCoucheEcoles", "dropdown");
        critere = 142;
        getNearbyPois(critere);
        nearbyPoisGeometryVector.changed();

        //COUCHE DES MOSQUEES
        changerClasseCss("listeCoucheMosquees", "dropdown");
        critere = 301;
        getNearbyPois(critere);
        nearbyPoisGeometryVector.changed();

        //COUCHE DES BANQUES
        changerClasseCss("listeCoucheBanques", "dropdown");
        critere = 150;
        getNearbyPois(critere);
        nearbyPoisGeometryVector.changed();

        //COUCHE DES HOTELS
        changerClasseCss("listeCoucheHotels", "dropdown");
        critere = 266;
        getNearbyPois(critere);
        nearbyPoisGeometryVector.changed();   


    }
    


    function getNearbyPoisPopup(name, longitude, latitude){
			mapAdvancedSearch_AddressGeometryVector.getSource().clear();
			map_advanced_search_address_popup.hide(undefined, ''); 
			$("#address_find_input").val(name);
			$("#nearby_address").empty();
			$("#nearby_address").append(name);
			var point_pos_search_inp = new ol.geom.Point([longitude,latitude]);
			var point_position_search_inp = new ol.Feature(point_pos_search_inp);
			mapAdvancedSearch_AddressGeometryVector.getSource().addFeature(point_position_search_inp);


            /*------------------------ Banque ---------------------*/
            
			removePoisFeatures('Banque');
		    $('#banque_tab').empty();
			critere = 150;
			$("#banque_btn").prop('checked', true);
			getNearbyPois(critere);
			nearbyPoisGeometryVector.changed();

            /*------------------------ Mosquee ---------------------*/
            
			removePoisFeatures('Mosquée');
		    $('#mosque_tab').empty();
			critere = 301;
			$("#mosque_btn").prop('checked', true);
			getNearbyPois(critere);
			nearbyPoisGeometryVector.changed();

            /*------------------------- Ecoles --------------------*/
            
			removePoisFeatures('Ecole Supérieure Et Institut Public');
		    $('#ecoles_tab').empty();
			critere = 142;
			$("#ecoles_btn").prop('checked', true);
			getNearbyPois(critere);
			nearbyPoisGeometryVector.changed();

            /*-------------------------- Hotel ---------------------*/
            
			removePoisFeatures('Hôtel');
		    $('#hotel_tab').empty();
			critere = 266;
			$("#hotel_btn").prop('checked', true);
			getNearbyPois(critere);
			nearbyPoisGeometryVector.changed();
        }
        

    
    function nearbyPoisStyle(feature, resolution) {	
            var s = getFeatureStyle(feature);
            return s;
        };  



    var nearbyPoisGeometryVector = new ol.layer.Vector(
			{	
				name: 'Nearby Pois',
				source: new ol.source.Vector(), 
				style : nearbyPoisStyle
			});
    map.addLayer(nearbyPoisGeometryVector); 


    function getNearbyPois(critere) {

        if (mapAdvancedSearch_AddressGeometryVector.getSource().getFeatures().length > 0) {
            var features = mapAdvancedSearch_AddressGeometryVector.getSource().getFeatures();
            var coordinates = ol.proj.transform(features[0].getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
    
            var res = '', res_b = '', res_e = '', res_h = '', res_m = '';
    
            $.ajax({
                url: 'http://www.navcities.com/api/proximite/?user=demo&maxNumberOfPois=20',
                data: {
                    lon: coordinates[0],
                    lat: coordinates[1],
                    crit: critere
                },
                type: 'GET',
                dataType: 'JSON',
                async: true,
                cache: false,
                timeout: 1000,
                success: function (result) {
                    
                    if (critere == 301) {
                        $("#nbrMosquees").empty();

                        $("#nbrMosquees").append((result.features.length));
                        $("#nbrMosqueesTitre").text($('#nbrMosquees').text() + " Mosquées disponibles");
                    }
                    else if (critere == 142) {
                        $("#nbrEcoles").empty();
                        // $("#nbrEcoles").append((result.features.length + nearbyPoisGeometryVector.getSource().getFeatures().length));
                        $("#nbrEcoles").append((result.features.length));
                        $("#nbrEcolesTitre").text($('#nbrEcoles').text() + " Écoles disponibles");
    
                    }
                    else if (critere == 150) {
                        $("#nbrBanques").empty();
                        $("#nbrBanques").append((result.features.length));
                        $("#nbrBanquesTitre").text($('#nbrBanques').text() + " Banques disponibles");
    
                    }
                    else if (critere == 266) {
                        $("#nbrHotels").empty();
                        $("#nbrHotels").append((result.features.length));
                        $("#nbrHotelsTitre").text($('#nbrHotels').text() + " Hôtels disponibles");
    
                    }
    
    
                    var features = geojsonFormat_geom.readFeatures(result, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
    
                    nearbyPoisGeometryVector.getSource().addFeatures(features);
                    var f = nearbyPoisGeometryVector.getSource().getFeatures();
    
                    if (f.length > 0) {
                        res += '<div class="todo-actions" style="overflow-y: scroll; height:250px;" >';
                        res += '<span class="desc">';
    
                        function arrayColumn(arr, n) {
                            return arr.map(x => x[n]);
                        }
    
                        var ar = [];
                        for (var i = 0; i < f.length; i++) {
                            ar.push([i, f[i].get("distance")]);
                        }
    
                        ar.sort(function (a, b) {
                            return a[1] - b[1];
                        });
    
                        for (var j = 0,i = arrayColumn(ar, 0)[0]; j < f.length; i = arrayColumn(ar, 0)[++j]) {
            
                            
                            var dis = ((f[i].get("distance") < 1000) ? Math.round(f[i].get("distance")) + ' m' : (f[i].get("distance") / 1000).toFixed(3) + ' km');
                           
                            if (f[i].get('souscategorie') == 'Ecole Supérieure Et Institut Public') {
                                res_e += '<a href="javascript:void(0);" onclick="zoomToPoi(\'' + f[i].get("nom").replace(/[']/g, "|") + '\',\'' + f[i].get("x") + '\',\'' + f[i].get("y") + '\', this)" class="list-group-item list-group-item-action flex-column align-items-start">';
                                res_e += '<div class="d-flex w-100 justify-content-between"><h5 style="margin-top: 0px;margin-bottom: 0px;" ><i class="glyphicon glyphicon-bookmark" style="margin-top: 11px;color: #007aff;"></i> ' + f[i].get("nom") + '</h5><small><span class="badge badge-secondary" style="background-color: #ff1744;" >' + dis + '</span></small><br /></div>';
                                res_e += '<strong>' + f[i].get("adresse") + '</strong><br />' + f[i].get("categorie") + '<br /><small>' + f[i].get("souscategorie") + '</small><br />';
    
                                if (f[i].get("tl") != "") {
                                    res_e += '<small><i class="icon-phone" style="color: green"></i> ' + f[i].get("tl") + '</small><br />';
                                }
                                if (f[i].get("fax") != "") {
                                    res_e += '<small><i class="icon-tv2"  style="color: blue"></i> ' + f[i].get("fax") + '</small><br />';
                                }
                                if (f[i].get("email") != "") {
                                    res_e += '<small><i class="icon-mail5"  style="color: red"></i> ' + f[i].get("email") + '</small><br />';
                                }
                                if (f[i].get("siteweb") != "") {
                                    res_e += '<small><i class="icon-at"  style="color: black"></i> ' + f[i].get("siteweb") + '</small><br />';
                                }
                            } else if (f[i].get('souscategorie') == 'Hôtel') {
                                res_h += '<a href="javascript:void(0);" onclick="zoomToPoi(\'' + f[i].get("nom").replace(/[']/g, "|") + '\',\'' + f[i].get("x") + '\',\'' + f[i].get("y") + '\', this)" class="list-group-item list-group-item-action flex-column align-items-start">';
                                res_h += '<div class="d-flex w-100 justify-content-between"><h5 style="margin-top: 0px;margin-bottom: 0px;" ><i class="glyphicon glyphicon-bookmark" style="margin-top: 11px;color: #007aff;"></i> ' + f[i].get("nom") + '</h5><small><span class="badge badge-secondary" style="background-color: #ff1744;" >' + dis + '</span></small><br /></div>';
                                res_h += '<strong>' + f[i].get("adresse") + '</strong><br />' + f[i].get("categorie") + '<br /><small>' + f[i].get("souscategorie") + '</small><br />';
    
                                if (f[i].get("tl") != "") {
                                    res_h += '<small><i class="icon-phone" style="color: green"></i> ' + f[i].get("tl") + '</small><br />';
                                }
                                if (f[i].get("fax") != "") {
                                    res_h += '<small><i class="icon-tv2"  style="color: blue"></i> ' + f[i].get("fax") + '</small><br />';
                                }
                                if (f[i].get("email") != "") {
                                    res_h += '<small><i class="icon-mail5"  style="color: red"></i> ' + f[i].get("email") + '</small><br />';
                                }
                                if (f[i].get("siteweb") != "") {
                                    res_h += '<small><i class="icon-at"  style="color: black"></i> ' + f[i].get("siteweb") + '</small><br />';
                                }
                            } else if (f[i].get('souscategorie') == 'Banque') {
                                res_b += '<a href="javascript:void(0);" onclick="zoomToPoi(\'' + f[i].get("nom").replace(/[']/g, "|") + '\',\'' + f[i].get("x") + '\',\'' + f[i].get("y") + '\', this)" class="list-group-item list-group-item-action flex-column align-items-start">';
                                res_b += '<div class="d-flex w-100 justify-content-between"><h5 style="margin-top: 0px;margin-bottom: 0px;" ><i class="glyphicon glyphicon-bookmark" style="margin-top: 11px;color: #007aff;"></i> ' + f[i].get("nom") + '</h5><small><span class="badge badge-secondary" style="background-color: #ff1744;" >' + dis + '</span></small><br /></div>';
                                res_b += '<strong>' + f[i].get("adresse") + '</strong><br />' + f[i].get("categorie") + '<br /><small>' + f[i].get("souscategorie") + '</small><br />';
    
                                if (f[i].get("tl") != "") {
                                    res_b += '<small><i class="icon-phone" style="color: green"></i> ' + f[i].get("tl") + '</small><br />';
                                }
                                if (f[i].get("fax") != "") {
                                    res_b += '<small><i class="icon-tv2"  style="color: blue"></i> ' + f[i].get("fax") + '</small><br />';
                                }
                                if (f[i].get("email") != "") {
                                    res_b += '<small><i class="icon-mail5"  style="color: red"></i> ' + f[i].get("email") + '</small><br />';
                                }
                                if (f[i].get("siteweb") != "") {
                                    res_b += '<small><i class="icon-at"  style="color: black"></i> ' + f[i].get("siteweb") + '</small><br />';
                                }
                            } else if (f[i].get('souscategorie') == 'Mosquée') {
                                res_m += '<a href="javascript:void(0);" onclick="zoomToPoi(\'' + f[i].get("nom").replace(/[']/g, "|") + '\',\'' + f[i].get("x") + '\',\'' + f[i].get("y") + '\', this)" class="list-group-item list-group-item-action flex-column align-items-start">';
                                res_m += '<div class="d-flex w-100 justify-content-between"><h5 style="margin-top: 0px;margin-bottom: 0px;" ><i class="glyphicon glyphicon-bookmark" style="margin-top: 11px;color: #007aff;"></i> ' + f[i].get("nom") + '</h5><small><span class="badge badge-secondary" style="background-color: #ff1744;" >' + dis + '</span></small><br /></div>';
                                res_m += '<strong>' + f[i].get("adresse") + '</strong><br />' + f[i].get("categorie") + '<br /><small>' + f[i].get("souscategorie") + '</small><br />';
    
                                if (f[i].get("tl") != "") {
                                    res_m += '<small><i class="icon-phone" style="color: green"></i> ' + f[i].get("tl") + '</small><br />';
                                }
                                if (f[i].get("fax") != "") {
                                    res_m += '<small><i class="icon-tv2"  style="color: blue"></i> ' + f[i].get("fax") + '</small><br />';
                                }
                                if (f[i].get("email") != "") {
                                    res_m += '<small><i class="icon-mail5"  style="color: red"></i> ' + f[i].get("email") + '</small><br />';
                                }
                                if (f[i].get("siteweb") != "") {
                                    res_m += '<small><i class="icon-at"  style="color: black"></i> ' + f[i].get("siteweb") + '</small><br />';
                                }
                            }
    
                        }
    
                        var fin = '</span></div>';
                    }
    
                    if (critere == 301) {
                        $("#ulMosquees").empty();
                        $("#ulMosquees").append(res+res_m+fin);
                    } else if (critere == 150) {
                        $("#ulBanques").empty();
                        $("#ulBanques").append(res+res_b+fin);
                    } else if (critere == 142) {
                        $("#ulEcoles").empty();
                        $("#ulEcoles").append(res+res_e+fin);
                    } else if (critere == 266) {
                        $("#ulHotels").empty();
                        $("#ulHotels").append(res+res_h+fin);
                    }
    
    
                },
                error: function () {
                    console.log('error parse !');
                },
                complete: function () {
                    $("#main_pois_list_content").show();
                    $('.pois-toggle').removeClass('close').addClass('open');
                    $('.pois-toggle').empty();
                    $('.pois-toggle').append('<i class="icon-chevron-thin-right"></i>');
                }
            });
        }
    }

            function getFeatureStyle(feature) {

                var st = [];
            
                function AppliquerStyleIcone(img){
                    st.push(new ol.style.Style({
                        image: new ol.style.Icon( ({
                          anchor: [0.5, 46],
                          anchorXUnits: 'fraction',
                          anchorYUnits: 'pixels',
                          src: "assets/img/"+img+".png"
                        }))
                      }));
                }
            
                switch (feature.get('souscategorie')) {
                    case "Banque":
                        AppliquerStyleIcone("banque");
                        break;
                    case "Mosquée":
                        AppliquerStyleIcone("mosquee");    
                        break;
                    case "Ecole Supérieure Et Institut Public":
                        AppliquerStyleIcone("ecole");
                        break;
                    case "Hôtel":
                        AppliquerStyleIcone("hotel");
                        break;
                }
                
                return st;
            }

            
            
 