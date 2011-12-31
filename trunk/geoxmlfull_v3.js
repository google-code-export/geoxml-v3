/******************************************************************************\
*  geoxml.js		                               by Lance Dyas          *
*  A Google Maps API Extension  GeoXml parser                                 *
*  GeoXml Parser based on my maps kml parser by Mike Williams called egeoxml  *
*  Additions include:   GML/WFS/GeoRSS/GPX expanded GE KML style support      *                                          
\******************************************************************************/
// Constructor
function KMLObj(title,desc,op,fid) {
	this.title = title;
  	this.description = escape(desc);
  	this.marks = [];
	this.folders = [];
	this.groundOverlays = [];
	this.open = op;
	this.folderid = fid;
	}

function Lance$(mid){ return document.getElementById(mid);}
var topwin = self;
var G = google.maps;
 
function GeoXml(myvar, map, url, opts) {
  // store the parameters
  this.myvar = myvar;
  this.opts = opts || {};
  this.mb = new MessageBox(map,this,"mb",this.opts.messagebox);
  this.map = map;
  this.url = url;
  if (typeof url == "string") {
    this.urls = [url];
  } else {
    this.urls = url;
  }
  
  this.mb.style = this.opts.messagestyle || { backgroundColor: "silver"};
  this.alwayspop = this.opts.alwaysinfopop || false;
  this.veryquiet = this.opts.veryquiet || false;
  this.quiet = this.opts.quiet || false;
  // infowindow styles
  this.titlestyle = this.opts.titlestyle || 'style = "font-family: arial, sans-serif;font-size: medium;font-weight:bold;"';
  this.descstyle = this.opts.descstyle || 'style = "font-family: arial, sans-serif;font-size: small;padding-bottom:.7em;"';
  if(this.opts.directionstyle && typeof this.opts.directionstyle != "undefined"){
	this.directionstyle = this.opts.directionstyle;
  	}
  else {
  this.directionstyle = 'style="font-family: arial, sans-serif;font-size: small;padding-left: 1px;padding-top: 1px;padding-right: 4px;"';
  }
  // sidebar
  this.sidebarfn = this.opts.sidebarfn || GeoXml.addSidebar;
  // elabel options 
  this.pointlabelopacity = this.opts.pointlabelopacity || 100;
  this.polylabelopacity = this.opts.polylabelopacity || 100;
   // other useful "global" stuff
  this.hilite  = this.opts.hilite || { color:"#aaffff",opacity: 0.3, textcolor:"#000000" };
  this.latestsidebar = "";
  this.forcefoldersopen = false;
  if(typeof this.opts.allfoldersopen !="undefined"){ this.forcefoldersopen = this.opts.allfoldersopen;}
  this.dohilite = false;
  if(typeof this.opts.dohilite != "undefined" && this.opts.dohilite==true){
	this.dohilite = true;
	}
  this.clickablepolys = true;
  this.zoomHere = 15; 
  if(typeof this.opts.zoomhere == "number" ){
	 this.zoomHere = this.opts.zoomhere;
 	 }
  if(typeof this.opts.clickablepolys == "boolean"){
	this.clickablepolys = this.opts.clickablepolys;
  	}
  this.clickablemarkers = true;
  if(typeof this.opts.clickablemarkers == "boolean" ){
       this.clickablemarkers = this.opts.clickablemarkers;  
       }
	   
  this.opts.singleInfoWindow = true;
  
  this.clickablelines = true;
  if(typeof this.opts.clickablelines == "boolean" ){
       this.clickablelines = this.opts.clickablelines;  
       }
  if(typeof this.opts.nolegend !="undefined"){
		this.nolegend = true;
		}
  if(typeof this.opts.preloadHTML == "undefined"){
	this.opts.preloadHTML = true;
  	}

  this.sidebariconheight = 16;
  if(typeof this.opts.sidebariconheight == "number"){
	 this.sidebariconheight = this.opts.sidebariconheight;
  	}
  this.sidebarsnippet = false;
  if(typeof this.opts.sidebarsnippet == "boolean"){
	this.sidebarsnippet = this.opts.sidebarsnippet;
  	}
  this.hideall = false;
  if(this.opts.hideall){ this.hideall = this.opts.hideall; }

  if(this.opts.markerpane && typeof this.opts.markerpane != "undefined"){
	this.markerpane = this.opts.markerpane;
	}
  else {
	var div = document.createElement("div");
	div.style.border = ""; 
	div.style.position = "absolute";
	div.style.padding = "0px";
	div.style.margin = "0px";
	div.style.fontSize = "0px";
	div.zIndex = 1001;
	//map.getPane(G_MAP_MARKER_PANE).appendChild(div);
	this.markerpane = div;
	this.markerpaneOnMap = false;
	}

  var c = map.getDiv();
  c.style.fontSize = "0px";
  
  if(typeof proxy!="undefined"){ this.proxy = proxy; }
  if(!this.proxy && typeof getcapproxy !="undefined") { 
	  	if(fixUrlEnd){ getcapproxy = fixUrlEnd(getcapproxy);  } 
 		}
  this.publishdirectory = "http://www.microimages.com/ogc/tntmap/";
  topwin = top;
  try {topname=top.title;}
  	catch(err){topwin=self;}
  if(topwin.publishdirectory){this.publishdirectory = topwin.publishdirectory; }
  if(topwin.standalone){this.publishdirectory = "";}
  this.kmlicon =  this.publishdirectory +"images/ge.png";
  this.docicon = this.publishdirectory +"images/ge.png";
  this.docclosedicon = this.publishdirectory +"images/geclosed.png";
  this.foldericon = this.publishdirectory + "images/folder.png";
  this.folderclosedicon = this.publishdirectory + "images/folderclosed.png";
  this.gmlicon = this.publishdirectory + "images/geo.gif";
  this.rssicon = this.publishdirectory + "images/rssb.png";
  this.globalicon = this.publishdirectory + "images/geo.gif"; 
  this.WMSICON = "<img src=\""+this.publishdirectory+"images/geo.gif\" style=\"border:none\" />";
  GeoXml.WMSICON = this.WMSICON;
  this.baseLayers = [];
  this.bounds = new google.maps.LatLngBounds();
  this.style = {width:2,opacity:0.75,fillopacity:0.4};
  this.style.color = this.randomColor();
  this.style.fillcolor = this.randomColor();
  this.iwwidth = this.opts.iwwidth || 400;
  this.maxiwwidth = this.opts.maxiwwidth || 0;
  this.iwheight = this.opts.iwheight || 0;
  this.lastMarker = {};   
  this.verySmall = 0.0000001;
  this.progress = 0;
  this.ZoomFactor = 2;
  this.NumLevels = 18;
  this.maxtitlewidth = 0; 
  this.styles = []; 
  this.currdeschead = "";
  this.jsdocs = [];
  this.jsonmarks = [];
  this.polyset = []; /* used while rendering */
  this.polygons = []; /*stores indexes to multi-polygons */ 
  this.polylines = []; /*stores indexes to multi-line */ 
  this.multibounds = []; /*stores extents of multi elements */
  this.overlayman = new OverlayManager(map, this);
  this.overlayman.rowHeight = 20;
  if(this.opts.sidebarid){ this.basesidebar = this.opts.sidebarid; }
  this.kml = [new KMLObj("GeoXML","",true,0)];
  this.overlayman.folders.push([]);
  this.overlayman.subfolders.push([]);
  this.overlayman.folderhtml.push([]);
  this.overlayman.folderhtmlast.push(0);
  this.overlayman.folderBounds.push(new google.maps.LatLngBounds()); 
  this.wmscount = 0;
 // this.labels = new GTileLayerOverlay(G_HYBRID_MAP.getTileLayers()[1]);
  this.unnamedpath="un-named path";
  this.unnamedplace="un-named place";
  this.unnamedarea="un-named area";
  }
  
GeoXml.prototype.setOpacity = function(opacity){
	this.opts.overrideOpacity = opacity;
	//alert("now using opacity "+opacity);
	for(var m=0;m<this.overlayman.markers.length;m++){
		var marker = this.overlayman.markers[m];
		if (marker.getPaths){ //polygon set fill opacity
		//	alert(marker.fillColor);
			this.overlayman.markers[m].fillOpacity = opacity;
			this.overlayman.markers[m].setOptions({fillOpacity:opacity});
			}
		else {
			if(marker.getPath){
				//alert(marker.strokeColor+" "+marker.strokeWeight)
				this.overlayman.markers[m].strokeOpacity = opacity;
				this.overlayman.markers[m].setOptions({strokeOpacity:opacity});
				}
			}
		
		}
	};
	
GeoXml.stripHTML = function(s){
	return (s.replace(/(<([^>]+)>)/ig,""));
	};

GeoXml.prototype.showIt = function (str, h, w) {
	var features = "status=yes,resizable=yes,toolbar=0,height=" + h + ",width=" + h + ",scrollbars=yes";
	var myWin;
	if (topwin.widget) {
		alert(str);
		this.mb.showMess(str);
		}
	else {
		myWin = window.open("", "_blank", features);
		myWin.document.open("text/xml");
		myWin.document.write(str);
		myWin.document.close();
		}
	};

GeoXml.prototype.clear = function(idx) {
	for(var m=0;m<this.overlayman.markers.length;m++){
		this.overlayman.RemoveMarker(this.overlayman.markers[m]);
		}
	this.kml = [new KMLObj("GeoXML","",true,0)];
 	this.maxtitlewidth = 0;
  	this.styles = []; 
	// associative array
  	this.jsdocs = [];
  	this.jsonmarks = [];
  	this.polyset = []; 
	/* used while rendering */
  	this.polylines = [];
  	this.multibounds = []; 
	this.bounds = new google.maps.LatLngBounds();
  	this.overlayman = new OverlayManager(this.map, this);
  	this.overlayman.rowHeight = 20;
	if(typeof this.basesidebar !="undefined" && this.basesidebar !=""){
		Lance$(this.basesidebar).innerHTML = "";
		}
  	this.overlayman.folders.push([]);
  	this.overlayman.subfolders.push([]);
  	this.overlayman.folderhtml.push([]);
  	this.overlayman.folderhtmlast.push(0);
	this.overlayman.byname = [];
    this.overlayman.byid = [];
  	this.overlayman.folderBounds.push(new google.maps.LatLngBounds()); 
 	this.wmscount = 0;
	this.currdeschead = "";
	};

 
// Create Marker
GeoXml.prototype.createMarkerJSON = function(item,idx) {
	var that = this;
	
	var style = that.makeIcon(style, item.href);
 	var point = new google.maps.LatLng(item.y,item.x);
	that.overlayman.folderBounds[idx].extend(point);
	that.bounds.extend(point);
	
	if(item.shadow){ style.shadow = item.shadow; }
		else{ style.shadow = null; }
	if (!!that.opts.createmarker) {
          	that.opts.createmarker(point, item.title, unescape(item.description), null, idx, style, item.visibility, item.id, item.href, item.snip);
        	} 
	else {
          	that.createMarker(point, item.title, unescape(item.description), null, idx, style, item.visibility, item.id, item.href, item.snip);
        	}
	};

GeoXml.prototype.createMarker = function(point, name, desc, styleid, idx, instyle, visible, kml_id, markerurl,snip) {
	   	var myvar = this.myvar;
	    var icon;
		var shadow;
	    var href;
		var scale = 1;
		if(instyle && instyle.scale){
			scale = instyle.scale;
			}
		var bicon;
		if(instyle){
			bicon = instyle;
			}
		else {
			var bicon = new google.maps.MarkerImage("http://maps.google.com/mapfiles/kml/pal3/icon40.png",
				new google.maps.Size(32*scale, 32*scale), //size
				new google.maps.Point(0, 0), //origin
				new google.maps.Point(16*scale, 16*scale), //anchor
				new google.maps.Size(32*scale, 32*scale) //scaledSize 
				);
			}

	    if (this.opts.baseicon) {
			bicon.size = this.opts.baseicon.size;
			bicon.origin = this.opts.baseicon.orgin;
			bicon.anchor = this.opts.baseicon.anchor;
			if (scale){
				if(instyle){
					bicon.scaledSize = instyle.scaledSize;
					}
				}
			else {
				bicon.scaledSize = this.opts.baseicon.scaledSize;
				}
			scale = 1;
			}
		icon = bicon;	
	    if (this.opts.iconFromDescription) {
	        var text = desc;
	        var pattern = new RegExp("<\\s*img", "ig");
	        var result;
	        var pattern2 = /src\s*=\s*[\'\"]/;
	        var pattern3 = /[\'\"]/;
	        while ((result = pattern.exec(text)) != null) {
	            var stuff = text.substr(result.index);
	            var result2 = pattern2.exec(stuff);
	            if (result2 != null) {
	                stuff = stuff.substr(result2.index + result2[0].length);
	                var result3 = pattern3.exec(stuff);
	                if (result3 != null) {
	                    var imageUrl = stuff.substr(0, result3.index);
	                    href = imageUrl;
	                }
	            }
	        }
	        shadow = null;
	        if (!href) {
	            href = "http://maps.google.com/mapfiles/kml/pal3/icon40.png";
				}
	        icon = bicon;//new google.maps.MarkerImage(bicon);
			icon.url = href;  
			}
	    else {
	        href = "http://maps.google.com/mapfiles/kml/pal3/icon40";
	        if (instyle == null || typeof instyle == "undefined") {
	            shadow = href + "s.png";
	            href += ".png";
	            if (this.opts.baseicon) {
	                href = this.opts.baseicon.url;
	               // shadow = this.opts.baseicon.shadow;
					}
				}
	        else {
	            if (instyle.url) { href = instyle.url; }
	           // if (instyle.shadow) { shadow = instyle.shadow; }
				}
	        icon = bicon; //new google.maps.MarkerImage(bicon);
			icon.url = href; //, href, null, shadow);
			}
	    var iwoptions = this.opts.iwoptions || {};
	    var markeroptions = this.opts.markeroptions || {};
	    var icontype = this.opts.icontype || "style";
		
	    if (icontype == "style") {
			var blark = this.styles[styleid];
	        if (!!blark) {
				icon = bicon;//new GIcon(bicon, this.styles[style].href, null, this.styles[style].shadow);
				icon.url = blark.url;
				icon.anchor = blark.anchor;
	            href = blark.url;
				}
			}
	    markeroptions.icon = icon;
	 
	    markeroptions.title = name;
		//markeroptions.image = icon.image;
		var start = icon.url.substring(0,4); //handle relative urls
		if(start.match(/^http/i)) {
			}
		else {
			if(typeof this.url == "string"){
				var slash = this.url.lastIndexOf("/");
				var changed = false;
				var subchanged = false;
				var newurl;
				if(slash != -1){
					newurl = this.url.substring(0,slash);
					changed = true;
					slash = 0;
					}
				
				while(slash != -1 && icon.url.match(/^..\//)){
					slash = newurl.lastIndexOf("/");
					icon.url = icon.url.substring(3);
					if (slash != -1){
						newurl = newurl.substring(0,slash);
						}
					changed = true;
					}
					
				if(newurl != "" && icon.url.match(/^..\//)){
					newurl = "";
					icon.url = icon.url.substring(3);
					}
			 
				if(newurl ==""){ markeroptions.icon.url = icon.url; }
				else { markeroptions.icon.url = newurl+"/"+ icon.url; }
				}
			}
		
		markeroptions.clickable = true;
		markeroptions.pane = this.markerpane;
		markeroptions.position = point;
		var m = new google.maps.Marker(markeroptions);
	    m.title = name;
	    m.id = kml_id;
	    var obj = { "type": "point", "title": name, "description": escape(desc), "href": href, "shadow": shadow, "visibility": visible, "x": point.x, "y": point.y, "id": m.id };
	    this.kml[idx].marks.push(obj);

	    if (this.opts.pointlabelclass) {
	        var l = new ELabel(point, name, this.opts.pointlabelclass, this.opts.pointlabeloffset, this.pointlabelopacity, true);
	        m.label = l;
	        l.setMap(this.map); 
			}
	    var html, html1, html2, html3, html4;
	    var awidth = this.iwwidth;
	    if (desc.length * 8 < awidth) {
	        awidth = desc.length * 8;
	    }
	    if (awidth < name.length * 10) {
	        awidth = name.length * 10;
	    }
	    if(this.maxiwwidth && awidth > this.maxiwwidth ){
			awidth = this.maxiwwidth;
	    	}
	    html = "<div style = 'width:" + awidth + "px'>" + "<h1 " + this.titlestyle + ">" + name + "</h1>";
		if(name != desc){
			html +=  "<div " + this.descstyle + ">" + desc + "</div>";
			}
	    var html1;
	    if (this.opts.directions) {
	        html1 = html + '<div ' + this.directionstyle + '>'
                     + 'Get Directions: <a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click2\');return false;">To Here</a> - '
                     + '<a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click3\');return false;">From Here</a><br>'
                     + '<a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click4\');return false;">Search nearby</a> | <a href="#" onclick="' + this.myvar + '.map.setCenter(new google.maps.LatLng(' + point.lat() + ',' + point.lng() + '),' + this.zoomHere + ');return false;">Zoom Here</a></div>';
	        html2 = html + '<div ' + this.directionstyle + '>'
                     + 'Get Directions: To here - '
                     + '<a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click3\');return false;">From Here</a><br>'
                     + 'Start address:<form action="http://maps.google.com/maps" method="get" target="_blank">'
                     + '<input type="text" SIZE=35 MAXLENGTH=80 name="saddr" id="saddr" value="" />'
                     + '<INPUT value="Go" TYPE="SUBMIT">'
                     + '<input type="hidden" name="daddr" value="' + point.lat() + ',' + point.lng() + "(" + name + ")" + '"/>'
                     + '<br><a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click1\');return false;">&#171; Back</a>| <a href="#" onclick="' + this.myvar + '.map.setCenter(new google.maps.LatLng(' + point.lat() + ',' + point.lng() + '),' + this.zoomHere + ');return false;">Zoom Here</a></div>';
	        html3 = html + '<div ' + this.directionstyle + '>'
                     + 'Get Directions: <a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click2\');return false;">To Here</a> - '
                     + 'From Here<br>'
                     + 'End address:<form action="http://maps.google.com/maps" method="get"" target="_blank">'
                     + '<input type="text" SIZE=35 MAXLENGTH=80 name="daddr" id="daddr" value="" />'
                     + '<INPUT value="Go" TYPE="SUBMIT">'
                     + '<input type="hidden" name="saddr" value="' + point.lat() + ',' + point.lng() + "(" + name + ")" + '"/>'
                     + '<br><a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click1\');return false;">&#171; Back</a> | <a href="#" onclick="' + this.myvar + '.map.setCenter(new google.maps.LatLng(' + point.lat() + ',' + point.lng() + '),' + this.zoomHere + ');return false;">Zoom Here</a></div>';
	        html4 = html + '<div ' + this.directionstyle + '>'
                     + 'Search nearby: e.g. "pizza"<br>'
                     + '<form action="http://maps.google.com/maps" method="get"" target="_blank">'
                     + '<input type="text" SIZE=35 MAXLENGTH=80 name="q" id="q" value="" />'
                     + '<INPUT value="Go" TYPE="SUBMIT">'
                     + '<input type="hidden" name="near" value="' + name + ' @' + point.lat() + ',' + point.lng() + '"/>'
         	     + '<br><a href="#" onclick="google.maps.event.trigger(' + this.myvar + '.lastMarker,\'click1\');return false;">&#171; Back</a> | <a href="#" onclick="' + this.myvar + '.map.setCenter(new google.maps.LatLng(' + point.lat() + ',' + point.lng() + '),' + this.zoomHere + ');return false;">Zoom Here</a></div>';
	        
			google.maps.event.addListener(m, "click1", function() {
				var infoWindowOptions = { 
					content: html1+"</div></div>", 
					pixelOffset: new google.maps.Size(0, 2)
				};
				if(this.geoxml.maxiwwidth){
					infoWindowOptions.maxWidth = this.geoxml.maxiwwidth;
					}
				m.infoWindow.setOptions(infoWindowOptions);
	        });
			
			google.maps.event.addListener(m, "click2", function() {
				var infoWindowOptions = { 
					content: html2+"</div></div>", 
					pixelOffset: new google.maps.Size(0, 2)
				};
				if(this.geoxml.maxiwwidth){
					infoWindowOptions.maxWidth = this.geoxml.maxiwwidth;
					}
				m.infoWindow.setOptions(infoWindowOptions);
	        });
	        google.maps.event.addListener(m, "click3", function() {
	           	var infoWindowOptions = { 
					content: html3+"</div></div>",
					pixelOffset: new google.maps.Size(0, 2)
				};
				if(this.geoxml.maxiwwidth){
					infoWindowOptions.maxWidth = this.geoxml.maxiwwidth;
					}
				m.infoWindow.setOptions(infoWindowOptions);
	        });
	        google.maps.event.addListener(m, "click4", function() {
			   	var infoWindowOptions = { 
					content: html4+"</div></div>",
					pixelOffset: new google.maps.Size(0, 2)
				};
				if(this.geoxml.maxiwwidth){
					infoWindowOptions.maxWidth = this.geoxml.maxiwwidth;
					}
				m.infoWindow.setOptions(infoWindowOptions);
	        });
	    } else {
	        html1 = html+"</div>";
	    }
  	if(this.opts.markerfollowlinks){
		if(markerurl && typeof markerurl=="string"){
			if(markerurl!=''){
				m.url = markerurl;
	    	  		google.maps.event.addListener(m, "click", function() {
					window.open(m.url,'_blank');
					try {
					eval(myvar + ".lastMarker = m");
					}
					catch(err){
					}
	            			
	        	});
		   }
	    	}
	    }
	    else {
	    if (this.clickablemarkers) {
			var geoxml = this;
			var infoWindowOptions = { 
				content: html1+"</div>",
				pixelOffset: new google.maps.Size(0, 2)
				};
			if(geoxml.maxiwwidth){
					infoWindowOptions.maxWidth = geoxml.maxiwwidth;
					}
			m.infoWindow = new google.maps.InfoWindow(infoWindowOptions);
			var parserOptions = this.opts;
			
    // Infowindow-opening event handler
		google.maps.event.addListener(m, 'click', function() {
			if (!!geoxml.opts.singleInfoWindow) {
				if (!!geoxml.lastMarker && !!geoxml.lastMarker.infoWindow) {
					geoxml.lastMarker.infoWindow.close();
					}
			geoxml.lastMarker = m;
			}
			this.infoWindow.open(this.map, this);
			});
	
			}
	    }
	    if (this.opts.domouseover) {
	        m.mess = html1 + "</div>";
	        m.geoxml = this;
	        google.maps.event.addListener(m, "mouseover", function(point) { if (!point) { point = m.getPosition(); } m.geoxml.mb.showMess(m.mess, 5000); });
			}
	    var nhtml = "";
	    var parm;
	    if (this.opts.sidebarid) {
	        var folderid = this.myvar + "_folder" + idx;
	        var n = this.overlayman.markers.length;
	        var blob = "&nbsp;<img style=\"vertical-align:text-top;padding:0;margin:0\" height=\""+this.sidebariconheight+"\" border=\"0\" src=\"" + href + "\">&nbsp;";
			if(this.sidebarsnippet){
			var desc2 = GeoXml.stripHTML(desc);
			desc2 = desc2.substring(0,40);}
			else {desc2 = '';	}
	        parm = this.myvar + "$$$" + name + "$$$marker$$$" + n + "$$$" + blob + "$$$" + visible + "$$$null$$$" + desc2;
	        m.sidebarid = this.myvar + "sb" + n;
	        m.hilite = this.hilite;
	        m.geoxml = this;
			m.onOver = function() {
					if(this.geoxml.dohilite){
						var bar = Lance$(this.sidebarid);
						if (bar && typeof bar != "undefined") {
							bar.style.backgroundColor = this.hilite.color;
							bar.style.color = this.hilite.textcolor;
							}
						}
					};
			m.onOut = function() {
				if(this.geoxml.dohilite){
					var bar = Lance$(this.sidebarid);
					if (bar && typeof bar != "undefined") {
						bar.style.background = "none";
						bar.style.color = "";
						}
					}
				};
			}
	    if (!!this.opts.addmarker) {
	        this.opts.addmarker(m, name, idx, parm, visible);
	    } else {
	        this.overlayman.AddMarker(m, name, idx, parm, visible);
	    }
	};

// Create Polyline

GeoXml.getDescription = function(node){
   var sub=""; 
   var n = 0;
   var cn; 
	if(typeof XMLSerializer != "undefined") {
	var serializer = new XMLSerializer();
	for(;n<node.childNodes.length;n++){
	 	cn = serializer.serializeToString(node.childNodes.item(n));
	     	sub += cn; 
		}
	}
	else {
		for(;n<node.childNodes.length;n++){
			cn = node.childNodes.item(n);
				sub += cn.xml; 
			}
		}
    var s = sub.replace("<![CDATA[","");
    var u = s.replace("]]>","");
    u = u.replace(/\&amp;/g,"&");
    u = u.replace(/\&lt;/g,"<"); 
    u = u.replace(/\&quot;/g,'"');
     u = u.replace(/\&apos;/g,"'");
    u = u.replace(/\&gt;/g,">");
    return u;
    };

GeoXml.prototype.processLine = function (pnum, lnum, idx){
	var that = this;
	var op = this.polylines[pnum];
	var line = op.lines[lnum];
	var obj;
	var p;
	if(!line){ return; }
    var thismap = this.map;
	var iwoptions = this.opts.iwoptions || {};
 	obj = { points:line, color:op.color, weight:op.width, opacity:op.opacity, type:"line", id: op.id };
	p = new google.maps.Polyline( {map:this.map,path:line,strokeColor:op.color,strokeWeight:op.width,strokeOpactiy:op.opacity});
	p.bounds = op.pbounds;
	p.id = op.id;
	var nhtml = "";
	var n = this.overlayman.markers.length;
	this.polylines[pnum].lineidx.push(n);
	var parm;
	 var awidth = this.iwwidth;
	 var desc = op.description;
	 if(desc.length * 8 <  awidth){
		awidth = desc.length * 8;
 		}
	 if(awidth < op.name.length * 12){
		awidth = op.name.length * 12;
 		}
	var html = "<div style='font-weight: bold; font-size: medium; margin-bottom: 0em;'>"+op.name;
  	html += "</div>"+"<div style='font-family: Arial, sans-serif;font-size: small;width:"+awidth+"px;'>"+desc+"</div>";

	if(lnum == 0){
	 	if(this.opts.sidebarid) {
    			var blob = '&nbsp;&nbsp;<span style=";border-left:'+op.width+'px solid '+op.color+';">&nbsp;</span> ';
				
			if(this.sidebarsnippet){
				var desc2 = GeoXml.stripHTML(desc);
				desc2 = desc2.substring(0,20);
				}
			else {desc2 = '';}
	      
			parm =  this.myvar+"$$$" +op.name + "$$$polyline$$$" + n +"$$$" + blob + "$$$" + op.visibility + "$$$" + pnum + "$$$" + desc2;
			this.latestsidebar = this.myvar +"sb"+n;
 			}
		}

	if(lnum < op.lines.length){
		setTimeout(this.myvar+".processLine("+pnum+","+(lnum+1)+",'"+idx+"');",15);
		if(this.opts.sidebarid) { p.sidebar = this.latestsidebar; }
		}
		
	if(this.opts.domouseover){
		p.mess = html;
		}
  	p.title = op.name;
    p.geoxml = this;
    p.strokeColor = op.color;
    p.strokeWeight = op.width;
	p.strokeOpacity = op.opacity;
	p.hilite = this.hilite;
	p.mytitle = p.title;
	p.map = this.map;
	p.idx = pnum;
	var position = p.getPosition();
	if(this.clickablelines){
		var infoWindowOptions = { 
				content: html,
				pixelOffset: new google.maps.Size(0, 2),
				position: position
				};
		if(this.maxiwwidth){
					infoWindowOptions.maxWidth = this.maxiwwidth;
					}
		p.infoWindow = new google.maps.InfoWindow(infoWindowOptions);
		}
	
  	p.onOver = function(){
		var pline = this.geoxml.polylines[this.idx];
		if(this.geoxml.dohilite){
			if(this.hidden!=true){
				for(var l=0;l<pline.lineidx.length;l++){
					var mark = this.geoxml.overlayman.markers[pline.lineidx[l]];
					mark.realColor = mark.strokeColor; 
					mark.realOpacity = mark.strokeOpacity;
					mark.setOptions({
						strokeColor:this.geoxml.hilite.color,
						strokeOpacity:this.geoxml.hilite.opacity
						});
					}
				}
			if(this.sidebar){
				Lance$(this.sidebar).style.backgroundColor = this.hilite.color;
				Lance$(this.sidebar).style.color = this.hilite.textcolor;
				}
			}
		if(this.mess) { this.geoxml.mb.showMess(this.mess,5000); } else { this.title = "Click for more information about "+this.mytitle; }
		};
  	p.onOut = function(){ 
		if(this.geoxml.dohilite){
			var pline = this.geoxml.polylines[this.idx];
			if(this.hidden!=true){
			//alert(pline.lineidx);
				for(var l=0; l < pline.lineidx.length; l++){
					var mark = this.geoxml.overlayman.markers[pline.lineidx[l]];
					mark.setOptions({
						strokeColor:p.realColor,
						strokeOpacity:p.realOpacity
						});
					//mark.redraw(true);
					}
				}
			
			if(this.sidebar){
				Lance$(this.sidebar).style.background = "none";
				Lance$(this.sidebar).style.color = "";
				}
			}
		this.geoxml.mb.hideMess();
		};

 	google.maps.event.addListener(p,"mouseout",p.onOut);
 	google.maps.event.addListener(p,"mouseover",p.onOver);

  	google.maps.event.addListener(p,"click", 
		function(point) {
			var dest;
			var doit = false;
			if(!point) { 
				doit = true; //sidebar click
				dest = p.getPosition();
				} 
			else {
				dest = point.latLng;
				}
			if(this.geoxml.clickablelines||doit){ 
				p.infoWindow.setPosition(dest);
				p.infoWindow.open(this.map); 
				}} 
			);
	obj.name = op.name;
    obj.description = escape(op.description);
	if(that.hideall) { 
		op.visibility = false;
		}
	obj.visibility = op.visibility;
 	this.kml[idx].marks.push(obj); 
 	this.overlayman.AddMarker(p, op.name, idx, parm, op.visibility);
};

GeoXml.prototype.createPolyline = function(lines,color,width,opacity,pbounds,name,desc,idx, visible, kml_id) {
    var p = {};
   	if(!color){p.color = this.randomColor();}
  	else { p.color = color; }
  	if(!opacity){p.opacity= 0.45;}
		else { p.opacity = opacity; }
  	if(!width){p.width = 4;}
 		 else{  p.width = width; }
  	p.idx = idx; 
	p.visibility = visible;
	if(this.hideall){ p.visibility = false; }
	p.name = name;
	p.description = desc;
 	p.lines = lines;
    p.lineidx = [];
	p.id = kml_id;
 	this.polylines.push(p);
	setTimeout(this.myvar+".processLine("+(this.polylines.length-1)+",0,'"+idx+"');",15);
	};

// Create Polygon

GeoXml.prototype.processPLine = function(pnum,linenum,idx) {
        	
	//alert(p.lines.length);
	var p = this.polyset[pnum];
	var line = p.lines[linenum];
	var obj = {};
	
	if(line && line.length){
		p.obj.polylines.push(line);
		}

	if(linenum == p.lines.length-1){	
		this.finishPolygon(p.obj,idx);
		}
	else {
	    setTimeout(this.myvar+".processPLine("+pnum+","+(linenum+1)+",'"+idx+"');",5);
	    }
	};	

GeoXml.prototype.finishPolygon = function(op,idx) {
  op.type = "polygon"; 
  this.finishPolygonJSON(op,idx,false);
   };

GeoXml.prototype.finishPolygonJSON = function(op,idx,updatebound,lastpoly) {
  var that = this;
  var iwoptions = that.opts.iwoptions || {};
  if(typeof op.visibility == "undefined") { op.visibility=true; }
  if(that.hideall){ op.visibility = false; }
  var desc = unescape(op.description);
  op.opacity = op.fillOpacity;
  var p = {};
  p.paths = op.polylines;
	//alert("my description"+ desc);
  var html = "<p style='font-family: Arial, sans-serif; font-weight: bold; font-size: medium; margin-bottom: 0em; margin-top:0em'>"+op.name+"</p>";
  if(desc != op.name){
  html += "<div style='font-family: Arial, sans-serif;font-size: small;width:"+this.iwwidth+"px;'>"+desc+"</div>";
  }
   
 var newgeom = (lastpoly != "p_"+op.name);
  if(newgeom && this.opts.sidebarid){
	this.latestsidebar = that.myvar +"sb"+  this.overlayman.markers.length;
	}
  else {
	this.latestsidebar = "";
  	}

  if(that.opts.domouseover){
  	p.mess = html;
	}
	if(op.strokeColor){
		p.strokeColor = op.strokeColor;
		}
	else {
		p.strokeColor = op.color;
		}
	if(op.outline) {
		if(op.strokeWeight){
			p.strokeWeight = op.strokeWeight;
			}
		else {
			p.strokeWeight = op.width;
			}
		p.strokeOpacity = op.strokeOpacity;
		}
	else {
		p.strokeWeight = 0;
		p.strokeOpacity = 0;
		}
  p.hilite = that.hilite;
  p.fillOpacity = op.opacity;
  p.fillColor = op.color.toString();
  var polygon = new google.maps.Polygon(p); //{paths:op.polylines}
  polygon.mb = that.mb;
 // if(!op.fill){ p.fillOpacity = 0.0; }
  if(that.domouseover){
	polygon.mess = html;
	}
  polygon.geoxml = that;
  polygon.title = op.name;
  polygon.id = op.id;
  var n = this.overlayman.markers.length;
  if(newgeom){
	that.multibounds.push(new google.maps.LatLngBounds());
 	that.polygons.push([]);
	}
  var len = that.multibounds.length-1;
  that.multibounds[len].extend(polygon.getBounds().getSouthWest());
  that.multibounds[len].extend(polygon.getBounds().getNorthEast()); 
  that.polygons[that.polygons.length-1].push(n);
  polygon.polyindex = that.polygons.length-1;
  polygon.geomindex = len;
  polygon.sidebarid = this.latestsidebar;
  
  
  
	var infoWindowOptions = { 
					content: html,
					pixelOffset: new google.maps.Size(0, 2),
					position: polygon.getCenter()
					};
	if(this.maxiwwidth){
			infoWindowOptions.maxWidth = this.maxiwwidth;
			}
			
	polygon.infoWindow = new google.maps.InfoWindow(infoWindowOptions);
				
  polygon.onOver = function(){ 
		if(this.geoxml.dohilite){
			if(this.sidebarid){
				var bar = Lance$(this.sidebarid);
				if(!!bar){
					bar.style.backgroundColor = this.hilite.color;
					bar.style.color = this.hilite.textcolor;
					}
				}
			if(this.geoxml.clickablepolys){
			
				var poly = this.geoxml.polygons[this.polyindex];
				if(poly && this.hidden!=true) {
					for (var pg =0;pg < poly.length;pg++) {
					var mark = this.geoxml.overlayman.markers[poly[pg]];
					var color;
					mark.realColor = p.fillColor;
					mark.realOpacity = p.fillOpacity;
					mark.setOptions({fillColor:this.hilite.color,fillOpacity:this.hilite.opacity});
					}
				}
			}
		}
	if(this.mess){ polygon.geoxml.mb.showMess(this.mess,5000); }
	};

		 
  polygon.onOut = function(){ 
	if(this.geoxml.dohilite){
		if(this.sidebarid){
			var bar = Lance$(this.sidebarid);
			if(!!bar){
				bar.style.background= "none";
				bar.style.color = "";
				}
			}
		var poly;
		if(this.geoxml.clickablepolys) {
			poly = this.geoxml.polygons[this.polyindex];
			}
		if(poly && this.hidden != true) {
			for (var pg =0;pg < poly.length;pg++) {
				var mark = this.geoxml.overlayman.markers[poly[pg]];
				var color = mark.realColor.toString();
				var opacity = mark.realOpacity.toString();
				mark.setOptions({fillColor:color,fillOpacity:opacity});
				//mark.redraw(true);
				}
			}
		}
	if(this.mess){ this.geoxml.mb.hideMess(); }
	};
	
	polygon.onClick = function(point) {
		if(!point && this.geoxml.alwayspop){
			bounds = this.geoxml.multibounds[this.geomindex]; 
			this.geoxml.map.fitBounds(bounds);
			point = {};
			point.latLng = bounds.getCenter(); 
			}
		if(!point){ 
			this.geoxml.mb.showMess("Zooming to "+polygon.title,3000);
			bounds = this.geoxml.multibounds[this.geomindex];  
			this.geoxml.map.fitBounds(bounds);
			}
		else { 
			if(this.geoxml.clickablepolys){ 
				if (!!this.geoxml.opts.singleInfoWindow) {
					if (!!this.geoxml.lastMarker && !!this.geoxml.lastMarker.infoWindow) {
						this.geoxml.lastMarker.infoWindow.close();
						}
					this.geoxml.lastMarker = this;
					}
			 	this.infoWindow.setPosition(point.latLng);
				this.infoWindow.open(this.geoxml.map);
				} 
			}
		};
	
	google.maps.event.addListener(polygon,"click",polygon.onClick );
	google.maps.event.addListener(polygon,"mouseout",polygon.onOut);
	google.maps.event.addListener(polygon,"mouseover",polygon.onOver);

  op.description = escape(desc);
  this.kml[idx].marks.push(op);
  polygon.setMap(this.map);
  var bounds;  
	 
	

if(this.opts.polylabelclass && newgeom ) {
 	var epoint =  p.getBounds().getCenter();
        var off = this.opts.polylabeloffset;
	if(!off){ off= new google.maps.Size(0,0); }
	off.x = -(op.name.length * 6);
 	var l = new ELabel(epoint, " "+op.name+" ", this.opts.polylabelclass, off, this.polylabelopacity, true);
	polygon.label = l;
	l.setMap(this.map); 
	}

  var nhtml ="";
  var parm;
 
  if (this.basesidebar &&  newgeom) { 
    var folderid = this.myvar+"_folder"+idx;
    var blob = "<span style=\"background-color:" + op.color + ";border:2px solid "+p.strokeColor+";\">&nbsp;&nbsp;&nbsp;&nbsp;</span> ";
    if(this.sidebarsnippet){
		var desc2 = GeoXml.stripHTML(desc);
		desc2 = desc2.substring(0,20);}
	else {desc2 = '';}
    parm =  this.myvar+"$$$" +op.name + "$$$polygon$$$" + n +"$$$" + blob + "$$$" +op.visibility+"$$$null$$$"+desc2; 
    }
   if(updatebound) {
  	var ne = polygon.getBounds().getNorthEast();
   	var sw = polygon.getBounds().getSouthWest();
   	this.bounds.extend(ne);
   	this.bounds.extend(sw);
   	this.overlayman.folderBounds[idx].extend(sw);
   	this.overlayman.folderBounds[idx].extend(ne);
	}
   this.overlayman.AddMarker(polygon,op.name,idx, parm, op.visibility);
   return op.name;
   };

GeoXml.prototype.finishLineJSON = function(po, idx, lastlinename){
	var m;
	var that = this;
	var thismap = this.map;
	m = new google.maps.Polyline({path:po.points,strokeColor:po.color,strokeWeight:po.weight,strokeOpacity:po.opacity,clickable:this.clickablelines}); 
	m.mytitle = po.name;
	m.title = po.name;
	m.strokeColor = po.color;
	m.strokeOpacity = po.opacity;
	m.geoxml = this;
    m.hilite = this.hilite;
	var n = that.overlayman.markers.length;
	var lineisnew = false;
	var pnum;
	if(("l_"+po.name) != lastlinename){
		lineisnew = true;
		that.polylines.push(po);
		pnum = that.polylines.length-1;
		that.polylines[pnum].lineidx = [];
		that.polylines[pnum].lineidx.push(n);
		that.latestsidebar = that.myvar +"sb"+n;
		}
	else {
		pnum = that.polylines.length-1;
		that.polylines[pnum].lineidx.push(n);
		}

	if(this.opts.basesidebar){
		m.sidebarid = that.latestsidebar;
		}
  	m.onOver = function(){
		if(this.geoxml.dohilite){
			if(!!this.sidebarid){
				var bar = Lance$(this.sidebarid);	
				if(bar && typeof bar !="undefined")
					{bar.style.backgroundColor = this.hilite.color;}
				}
			this.realColor = this.strokeColor;
			if(m.hidden!=true){
				if(m && typeof m!="undefined"){ 
				m.setOptions({strokeColor:this.hilite.color}); }
				//this.redraw(true);
				}
			}
		if(this.mess) { this.geoxml.mb.showMess(this.mess,5000); } else { this.title = "Click for more information about "+this.mytitle; }
		};
  	m.onOut = function(){ 	
		if(this.geoxml.dohilite){
			if(!!this.sidebarid){
				var bar = Lance$(this.sidebarid);	
				if(bar && typeof bar !="undefined"){bar.style.background = "none"; }
				}
			if(m.hidden!=true){
				if(m && typeof m!="undefined"){ m.setOptions({strokeColor:this.realColor}); }
				//this.redraw(true);
				}
			}
		if(this.mess){ this.geoxml.mb.hideMess(); }
		};
 
	google.maps.event.addListener(m,"mouseover",m.onOver);
	google.maps.event.addListener(m,"mouseover",m.onOut);
	 

	var parm = "";
	that.kml[idx].marks.push(po);
	var desc = unescape(po.description);
	 var awidth = this.iwwidth;
 	if(desc.length * 8 <  awidth){
		awidth = desc.length * 8;
 		}
 	if(awidth < po.name.length * 12){
		awidth = po.name.length * 12;
 		}

	var html = "<div style='font-family: Arial, sans-serif; font-weight: bold; font-size: medium; margin-bottom: 0em;'>"+po.name +"</div>";
	if (po.name != desc) {
		html += "<div style='font-family: Arial, sans-serif;font-size: small;width:"+awidth+"px'>"+desc+"</div>";
		}
	m.map = this.map;
	var infoWindowOptions = { 
				content: html,
				pixelOffset: new google.maps.Size(0, 2),
				position:point
				};
	if(this.maxiwwidth){
			infoWindowOptions.maxWidth = this.maxiwwidth;
			}
	m.infoWindow = new google.maps.InfoWindow(infoWindowOptions);
	if(this.clickablelines){
  		google.maps.event.addListener(m,"click", function(point) {
		if(!point){ point=m.getPosition(); } 
			this.infoWindow.open();
		} );
		}

	if(that.basesidebar && lineisnew) {
    		var blob = '&nbsp;&nbsp;<span style=";border-left:'+po.weight+'px solid '+po.color+';">&nbsp;</span> ';
		if(typeof po.visibility == "undefined"){ po.visibility = true; }
			if(this.sidebarsnippet){
				var desc2 = GeoXml.stripHTML(desc);
				desc2 = desc2.substring(0,20);}
			else {desc2 = '';}
		parm =  that.myvar+"$$$" +po.name + "$$$polyline$$$" + n +"$$$" + blob + "$$$" +po.visibility+"$$$"+(that.polylines.length-1)+"$$$"+desc2;
 		}	
	
	var ne = m.getBounds().getNorthEast();
	var sw = m.getBounds().getSouthWest();
	that.bounds.extend(ne);
	that.bounds.extend(sw);
	that.overlayman.folderBounds[idx].extend(sw);
	that.overlayman.folderBounds[idx].extend(ne);
	that.overlayman.AddMarker(m, po.name, idx, parm, po.visibility);	
	return(po.name);	
	};
	
GeoXml.prototype.handlePlaceObj = function(num, max, idx, lastlinename, depth){
	var that = this;
	var po = that.jsonmarks[num];
	var name = po.name;
	if(po.title){ name = po.title; }
	if(name.length+depth > that.maxtitlewidth){ that.maxtitlewidth = name.length+depth; }
	switch (po.type) {
			case "polygon" :
				lastlinename = "p_"+ that.finishPolygonJSON(po,idx,true,lastlinename);
				break;
			case "line" :  
			case "polyline" :
				lastlinename = "l_"+ that.finishLineJSON(po,idx,lastlinename);		
				break;
			case "point":
          			that.createMarkerJSON(po,idx);
				lastlinename = "";
				break;
		 	}
	if (num < max-1){
		var act = that.myvar+".handlePlaceObj("+(num+1)+","+max+","+idx+",\""+lastlinename+"\","+depth+");";
		document.status = "processing "+name;
		setTimeout(act,1);
		}
	else {
		lastlinename = "";		
		if(num == that.jsonmarks.length-1){
			that.progress--;
    			if (that.progress <= 0) {
      		 	// Shall we zoom to the bounds?
      				if (!that.opts.nozoom) {
						that.map.fitBounds(that.bounds); 
      					}
      				google.maps.event.trigger(that,"parsed");
					that.setFolders();
      				if(!that.opts.sidebarid){
					that.mb.showMess("Finished Parsing",1000);
					that.ParseURL();	
					}
				}
	 		}
		}
	};

GeoXml.prototype.parseJSON  = function (doc, title, latlon, desc, sbid){
	var that = this;
 	that.overlayman.miStart = new Date();
	that.jsdocs = eval('(' + doc + ')');
	var bar = Lance$(that.basesidebar);
	if(bar){ bar.style.display=""; }
	that.recurseJSON(that.jsdocs[0], title, desc, that.basesidebar, 0);
	};

GeoXml.prototype.setFolders = function() {
	var that = this;
	var len = that.kml.length;
	for(var i=0;i<len;i++){
		var fid = that.kml[i].folderid;
		var fidstr = new String(fid);
		var fb = fidstr.replace("_folder","FB");
	 	var fi = Lance$(fb);
		var fob = Lance$(fid);
 		if(fob !== null && fid!= that.opts.sidebarid) {
			if(!!that.kml[i].open){
				fob.style.display='block';
				}
			else {
				fob.style.display='none';
				if(fi.src==that.foldericon){ fi.src = that.folderclosedicon;}
				if(fi.src==that.docicon){ fi.src = that.docclosedicon; }
				}
			}
		}
	 
	};
 
GeoXml.prototype.recurseJSON = function (doc, title, desc, sbid, depth){
	var that = this;
	var polys = doc.marks;
	var name = doc.title;
	if(!sbid){ sbid = 0; }
	var description = unescape(doc.description);
	if(!description && desc){ description = desc; }
	var keepopen = that.forcefoldersopen;
	if(doc.open){ keepopen = true; }
	var visible = true;
	if(typeof doc.visibility!="undefined" && doc.visibility){visible = true; }
	if(that.hideall){visible = false;}
       	var snippet = doc.snippet;
	var idx = that.overlayman.folders.length;
	if(!description){ description = name; }
	var folderid;
	var icon;
	that.overlayman.folders.push([]);
	that.overlayman.subfolders.push([]);
    	that.overlayman.folderhtml.push([]);
    	that.overlayman.folderhtmlast.push(0);
	that.overlayman.folderBounds.push(new google.maps.LatLngBounds());
	that.kml.push(new KMLObj(title,description,keepopen));
	if((!depth && (doc.folders && doc.folders.length >1)) || doc.marks.length){
		if(depth < 2 || doc.marks.length < 1) { icon = that.globalicon; }
		else { icon = that.foldericon;}
		folderid = that.createFolder(idx, name, sbid, icon, description, snippet, keepopen, visible);
		} 
	else {
		folderid = sbid;
		}
	var parm, blob;
	var nhtml ="";
	var html;
	var m;
	var num = that.jsonmarks.length;
	var max = num + polys.length;
 	for(var p =0;p<polys.length;p++){
		var po = polys[p];
		that.jsonmarks.push(po);
		desc = unescape(po.description);
		m = null;
 		if(that.opts.preloadHTML && desc && desc.match(/<(\s)*img/i)){
			var preload = document.createElement("span");
     		preload.style.visibility = "visible";
			preload.style.position = "absolute";
			preload.style.left = "-1200px";
			preload.style.top = "-1200px";
			preload.style.zIndex = this.overlayman.markers.length; 
     		document.body.appendChild(preload);
			preload.innerHTML = desc;
			}	 
		}	

	if(that.groundOverlays){
		}

	if(polys.length){ that.handlePlaceObj(num,max,idx,null,depth); }
	var fc = 0;
	var fid = 0;
	if(typeof doc.folders!="undefined"){
		fc = doc.folders.lenth;
		for(var f=0;f<doc.folders.length;++f){
			var nextdoc = that.jsdocs[doc.folders[f]];
			fid = that.recurseJSON(nextdoc, nextdoc.title, nextdoc.description, folderid, (depth+1));
			that.overlayman.subfolders[idx].push(fid);
			that.overlayman.folderBounds[idx].extend(that.overlayman.folderBounds[fid].getSouthWest());
			that.overlayman.folderBounds[idx].extend(that.overlayman.folderBounds[fid].getNorthEast());
			if(fid != idx){ that.kml[idx].folders.push(fid); }
			}
		}

        if(fc || polys.length ){
		that.bounds.extend(that.overlayman.folderBounds[idx].getSouthWest());
		that.bounds.extend(that.overlayman.folderBounds[idx].getNorthEast());
		}

	return idx;
	};

GeoXml.prototype.createPolygon = function(lines,color,width,opacity,fillcolor,fillOpacity, pbounds, name, desc, folderid, visible,fill,outline,kml_id) {
  var thismap = this.map;
  
  var p = {};	
  p.obj = {"description":desc,"name":name };
  p.obj.polylines = []; 
  p.obj.id = kml_id;
  p.obj.visibility = visible;
  p.obj.fill = fill;
  p.obj.outline = outline; 
  p.fillcolor = fillcolor;
  p.obj.strokecolor = color; 
  p.strokeOpacity = opacity;
  
  if(!color){p.strokeColor = this.style.color;}
  else { p.strokeColor = color; }
 
  if(!fillcolor){ p.obj.color = this.randomColor(); }
  else {p.obj.color = fillcolor;}

  if(!!opacity){p.obj.opacity= opacity;}
	else{ 
		p.obj.opacity = this.style.opacity; 
		p.strokeOpacity = this.style.opacity;
		}

  if(!!fillOpacity){p.obj.fillOpacity = fillOpacity;}
   else { 
	   p.obj.fillOpacity = this.style.fillopacity;
		}

  if(!width){p.strokeWeight = this.style.width;}
  else{ p.strokeWeight = width; }

  p.bounds = pbounds;
  p.lines = lines;
  p.sidebarid = this.opts.sidebarid;
  this.polyset.push(p);
 // document.status = "processing poly "+name;
 // alert(name);
  setTimeout(this.myvar+".processPLine("+(this.polyset.length-1)+",0,'"+folderid+"')",1);
};

GeoXml.prototype.toggleFolder = function(i){
	var f = Lance$(this.myvar+"_folder"+i);
	var tb = Lance$(this.myvar+"TB"+i);

	var folderimg = Lance$(this.myvar+'FB'+i);

	if(f.style.display=="none"){
			f.style.display="";
			if(tb){ tb.style.fontWeight = "normal"; }
				if(folderimg.src == this.folderclosedicon){
					folderimg.src = this.foldericon;
					}
				if(folderimg.src == this.docclosedicon){
					folderimg.src = this.docicon;
					}
			}
		else{ 
			f.style.display ="none"; 
			if(tb){ tb.style.fontWeight = "bold"; }
				if(folderimg.src == this.foldericon){
					folderimg.src = this.folderclosedicon;
					}
				if(folderimg.src == this.docicon){
					folderimg.src = this.docclosedicon;
					}
			}
		 
	};

GeoXml.prototype.saveJSON = function(){

	if(topwin.standalone){
		var fpath = browseForSave("Select a directory to place your json file","JSON Data Files (*.js)|*.js|All Files (*.*)|*.*","JSON-DATA");

 		if(typeof fpath!="undefined"){
			var jsonstr = JSON.stringify(this.kml);
			 saveLocalFile (fpath+".js",jsonstr); 
			}
		return;
		}

	if(typeof JSON != "undefined"){
		var jsonstr = JSON.stringify(this.kml);
		if(typeof serverBlessJSON!="undefined"){
			serverBlessJSON(escape(jsonstr),"MyKJSON"); 
			}
		else {
			this.showIt(jsonstr);
			}
		}
	else {
		var errmess="No JSON methods currently available";
		if(console){
			console.error(errmess);
			}
		else { alert(errmess); }
		}
	};

GeoXml.prototype.hide = function(){
	//if(this.polylines.length > 0 || this.polygons.length > 0){
		this.contentToggle(1,false);
		this.overlayman.currentZoomLevel = -1;
		OverlayManager.Display(this.overlayman);
	//	}
	//else {
	//does not support matching sidebar entry toggling yet
	//	this.markerpane.style.display = "none";
	//	alert("hiding marker pane");
	//	}
	};
GeoXml.prototype.setMap = function(map){
	if(map){
		this.show();
		}
	else {
		this.hide();
		}
	};
GeoXml.prototype.show = function(){
	//if(this.polylines.length > 0 || this.polygons.length > 0){
		this.contentToggle(1,true);
		this.overlayman.currentZoomLevel = -1;
		OverlayManager.Display(this.overlayman);
	//	}
	//else {
	//does not support matching sidebar entry toggling yet
		//alert("showing marker pane");
	//	this.markerpane.style.display = "";
	//	}
	};

GeoXml.prototype.toggleContents = function(i,show){
	this.contentToggle(i,show);
	this.overlayman.currentZoomLevel = -1;
	OverlayManager.Display(this.overlayman);
	//setTimeout("OverlayManager.Display("+this.var+".overlayman)",10000);
	};

GeoXml.prototype.contentToggle = function(i,show){
 	var f = this.overlayman.folders[i];
	var cb;
	var j;
	
	var m;
	if(typeof f == "undefined"){
		this.mb.showMess("folder "+f+" not defined");
		return;
		}
	//alert(f.length+" "+this.overlayman.markers.length);
	if(show){
	for (j=0;j<f.length;j++){
		   this.overlayman.markers[f[j]].setMap(this.map);
		   this.overlayman.markers[f[j]].onMap = true;
			if(this.basesidebar){	
				cb = Lance$(this.myvar+''+f[j]+'CB');
				if(cb && typeof cb!="undefined"){ cb.checked = true; }
				}
			this.overlayman.markers[f[j]].hidden = false;
			}
		}
	else {
	   for (j=0;j<f.length;j++){
			this.overlayman.markers[f[j]].hidden = true;
			this.overlayman.markers[f[j]].onMap = false;
			this.overlayman.markers[f[j]].setMap(null);
			if(this.basesidebar){
				cb = Lance$(this.myvar+''+f[j]+'CB');
				if(cb && typeof cb!="undefined" ){cb.checked = false;}
				}
			
			}
		}

	var sf = this.overlayman.subfolders[i];
	if(typeof sf!="undefined"){
 		for (j=0;j<sf.length;j++){
			if(sf[j]!=i){
				if(this.basesidebar){
	 				cb = Lance$(this.myvar+''+sf[j]+'FCB');
					if(cb && typeof cb!="undefined"){ cb.checked = (!!show);}
					}
				this.contentToggle(sf[j],show);
				}
			}
		 }
	};


GeoXml.prototype.showHide = function(a,show, p){ // if a is not defined then p will be.
	var m, i;
 	if(a!== null){	
		if(show){
			this.overlayman.markers[a].setMap(this.map);
			this.overlayman.markers[a].onMap = true;
			this.overlayman.markers[a].hidden = false; 
		//	if(!!this.overlayman.markers[a].label){ this.overlayman.markers[a].label.show();  }
			}	
		else  { 
			this.overlayman.markers[a].setMap(null);
			this.overlayman.markers[a].onMap = false;
			this.overlayman.markers[a].hidden = true;
			//if(!!this.overlayman.markers[a].label){ this.overlayman.markers[a].label.hide(); }       
			}
		}
	else {
		var ms = this.polylines[p];
		if(show){
			for(i=0;i<ms.lineidx.length;i++){
				this.overlayman.markers[ms.lineidx[i]].setMap(this.map); 
				this.overlayman.markers[ms.lineidx[i]].onMap = true;
				this.overlayman.markers[ms.lineidx[i]].hidden = false;	
				}
		    }
		else {
			for(i=0;i<ms.lineidx.length;i++){
				this.overlayman.markers[ms.lineidx[i]].setMap(null); 
				this.overlayman.markers[ms.lineidx[i]].onMap = false;
				this.overlayman.markers[ms.lineidx[i]].hidden = true;	
			//	if(!!m.label){m.label.hide(); }
				}
		    }
	    }
	this.overlayman.currentZoomLevel = -1;
	OverlayManager.Display(this.overlayman,true);
	};


GeoXml.prototype.toggleOff = function(a,show){
	if(show){ 
		this.overlayman.markers[a].setMap(this.map);
		this.overlayman.markers[a].hidden = false; 
		}	
	else  { 
		this.overlayman.markers[a].setMap(null);
		this.overlayman.markers[a].hidden = true;
		}
	if(this.labels.onMap){
		this.labels.setMap(null);
 		this.labels.setMap(this.map); 
		}
	};

// Sidebar factory method One - adds an entry to the sidebar
GeoXml.addSidebar = function(myvar, name, type, e, graphic, ckd, i, snippet) {
   var check = "checked";
   if(ckd=="false"){ check = ""; }
    var h="";
    var mid = myvar+"sb"+e;
    if(snippet && snippet != "undefined"){
	snippet = "<br><span class='"+myvar+"snip'>"+snippet+"</span>";
    	}
    else {
	    snippet = "";
    }
   switch(type) {
   case  "marker" :  h = '<li id="'+mid+'" onmouseout="google.maps.event.trigger(' + myvar+ '.overlayman.markers['+e+'],\'mouseout\');" onmouseover="google.maps.event.trigger(' + myvar+ '.overlayman.markers['+e+'],\'mouseover\');" ><input id="'+myvar+''+e+'CB" type="checkbox" style="vertical-align:middle" '+check+' onclick="'+myvar+'.showHide('+e+',this.checked)"><a href="#" onclick="google.maps.event.trigger(' + myvar+ '.overlayman.markers['+e+'],\'click\');return false;">'+ graphic + name + '</a>'+snippet+'</li>';
   break;
  case  "polyline" :  h = '<li id="'+mid+'"  onmouseout="'+myvar+ '.overlayman.markers['+e+'].onOut();" onmouseover="'+myvar+ '.overlayman.markers['+e+'].onOver();" ><input id="'+myvar+''+e+'CB" type="checkbox" '+check+' onclick="'+myvar+'.showHide(null,this.checked,'+i+')"><span style="margin-top:6px;"><a href="#" onclick="google.maps.event.trigger(' + myvar+ '.overlayman.markers['+e+'],\'click\');return false;">&nbsp;' + graphic + name + '</a></span>'+snippet+'</li>';
  break;
  case "polygon": h = '<li id="'+mid+'"  onmouseout="'+myvar+ '.overlayman.markers['+e+'].onOut();" onmouseover="'+myvar+ '.overlayman.markers['+e+'].onOver();" ><input id="'+myvar+''+e+'CB" type="checkbox" '+check+' onclick="'+myvar+'.showHide('+e+',this.checked)"><span style="margin-top:6px;"><a href="#" onclick="google.maps.event.trigger(' + myvar+ '.overlayman.markers['+e+'],\'click\');return false;">&nbsp;' + graphic + name + '</a></span></nobr>'+snippet+'</li>';
  break;
 case "groundoverlay": h = '<li id="'+mid+'"><input id="'+myvar+''+e+'CB" type="checkbox" '+check+' onclick="'+myvar+'.showHide('+e+',this.checked)"><span style="margin-top:6px;"><a href="#" onclick="google.maps.event.trigger(' + myvar+ '.overlayman.markers['+e+'],\'zoomto\');return false;">&nbsp;' + graphic + name + '</a></span>'+snippet+'</li>';
   break;
case "tiledoverlay": h = '<li id="'+mid+'"><nobr><input id="'+myvar+''+e+'CB" type="checkbox" '+check+' onclick="'+myvar+'.toggleOff('+e+',this.checked)"><span style="margin-top:6px;"><a href="#" oncontextMenu="'+myvar+'.upgradeLayer('+i+');return false;" onclick="google.maps.event.trigger(' + myvar+ '.overlayman.markers['+e+'],\'zoomto\');return false;">'+GeoXml.WMSICON +'&nbsp;'+ name + '</a><br />'+ graphic +'</span>'+snippet+'</li>';
   break;
}
return h;
};

// Dropdown factory method
GeoXml.addDropdown = function(myvar,name,type,i,graphic) {
    return '<option value="' + i + '">' + name +'</option>';
};

// Request to Parse an XML file

GeoXml.prototype.parse = function(titles) {
 var that = this;
 var names =[];
 if(typeof titles !="undefined"){
 if(typeof titles!= "string") {
 	names = titles;
	}
 else {
	names = titles.split(",");
	}
}
 that.progress += that.urls.length;
 for (var u=0; u<that.urls.length; u++) {
   var title = names[u];
  if(typeof title =="undefined" || !title || title =="null" ){
  	var segs = that.urls[u].split("/");
	title = segs[segs.length-1];
	}
   that.mb.showMess("Loading "+title);
   var re = /\.js$/i;
   if(that.urls[u].search(re) != -1){
	that.loadJSONUrl(this.urls[u], title);
	}
   else {
 	that.loadXMLUrl(this.urls[u], title);	}
 }
};

GeoXml.prototype.removeAll = function() {
	this.allRemoved = true;
	for (var a=0;a < this.overlayman.markers.length; a++) {
		this.toggleOff(a,false);
		}
	};
	
GeoXml.prototype.addAll = function() {
	this.allRemoved = false;
	for (var a=0;a < this.overlayman.markers.length; a++) {
		this.toggleOff(a,true);
		}
	};
	
GeoXml.prototype.processString = function(doc,titles,latlon) {
  var names =[];
 if(titles) {
 	names = titles.split(",");
	}
  if (typeof doc == "string") {
    this.docs = [doc];
  } else {
    this.docs = doc;
  }
  this.progress += this.docs.length;
  for (var u=0; u<this.docs.length; u++) {
    this.mb.showMess("Processing "+names[u]);
    this.processing(this.parseXML(this.docs[u]),names[u],latlon);
  }
};

// Cross-browser xml parsing
GeoXml.prototype.parseXML = function( data ) {
		var xml, tmp;
		try {
			if ( window.DOMParser ) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString( data , "text/xml" );
			} else { // IE
				xml = new ActiveXObject( "Microsoft.XMLDOM" );
				xml.async = "false";
				xml.loadXML( data );
			}
		} catch( e ) {
			xml = undefined;
		}
		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
			var errmess = "Invalid XML: " + data;
			if (console){
				console.error(errmess);
				}
			else { alert(errmess); }
		}
		return xml;
	};

GeoXml.prototype.getText = function( elems ) {
	var ret = "", elem;
	if (!elems||!elems.childNodes)
		return ret;
		
	elems = elems.childNodes;

	for ( var i = 0; elems[i]; i++ ) {
		elem = elems[i];

		// Get the text from text nodes and CDATA nodes
		if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
			ret += elem.nodeValue;

		// Traverse everything else, except comment nodes
		} else if ( elem.nodeType !== 8 ) {
			ret += this.getText( elem.childNodes );
		}
	}

	return ret;
};

GeoXml.prototype.processXML = function(doc,titles,latlon) {
 var names =[];
 if(typeof titles !="undefined"){
 	if(typeof titles == "string") {
 		names = titles.split(",");
		}
	 else {  names = titles; }
	}

  if(typeof doc == "array"){
	this.docs = doc;
	}
  else {
 	this.docs = [doc];
	}
  this.progress += this.docs.length;
  for (var u=0; u<this.docs.length; u++) {
	var mess = "Processing "+names[u];
	this.mb.showMess(mess);
  	this.processing(this.docs[u],names[u],latlon);
	}
};

GeoXml.prototype.makeDescription = function(elem, title, depth) {
         var d = ""; 
	 var len = elem.childNodes.length;
	 var ln = 0;
	 var val;

	 while (len--) {
		var subelem = elem.childNodes.item(ln);
		var nn = subelem.nodeName;
		var sec = nn.split(":");
		var base = "";
		if(sec.length>1){	       
			base = sec[1];
			}
		else { base = nn;}
 	
		if(base.match(/^(lat|long|visible|visibility|boundedBy|StyleMap|drawOrder|styleUrl|posList|coordinates|Style|Polygon|LineString|Point|LookAt|drawOrder|Envelope|Box|MultiPolygon|where|guid)/)){
 			this.currdeschead = ""; 
			}
		else {
			
			if(base.match(/#text|the_geom|SchemaData|ExtendedData|#cdata-section/)){}
			else {
				if(base.match(/Snippet/i)){ 
						}
				else {	
					if(base.match(/SimpleData/)){
						base = subelem.getAttribute("name");
						}
					this.currdeschead = "<b>&nbsp;"+base+"&nbsp;</b> :";
					}
				}
			val = subelem.nodeValue;
			if(nn == "link"){
				var href = subelem.getAttribute("href");
				if(href && href!='null'){
					val = '<a target="_blank" title="'+href+'" href="' + href + '">Link</a>';
					}
				else {
					if(val && val!= "null"){
					val = '<a target="_blank" title="'+val+'" href="' + val + '">Link</a>';
						}
					}
				this.currdeschead = "Link to Article"; 
				}
			if(base.match(/(\S)*(name|title)(\S)*/i)){
			 	if(!val){ val = this.getText(subelem) }
				title = val;
				if(val && typeof title!="undefined" && title.length > this.maxtitlewidth){
					this.maxtitlewidth = title.length;
					}
				this.currdeschead="";
				}
			else {
				 if(val && val.match(/(\S)+/)){		
					if (val.match(/^http:\/\/|^https:\/\//i)) {
        	    				val = '<a target="_blank" " href="' + val + '">[go]</a>';
      		    				}
					else {
						if(!title || title==""){
							title = val;	
							if(val && typeof title!="undefined" && title.length > this.maxtitlewidth){
								this.maxtitlewidth = title.length;
								}
							}
						}
				
					}
			   if(val && val !="null" && val!='  ' && val!= ' ' && (val.match(/(\s|\t|\n)*/)!=true)) { 
				if(this.currdeschead != ''){ d += '<br />';}
				d += this.currdeschead + ""+val+""; this.currdeschead = ""; 
			   	}
			
				if(subelem.childNodes.length){
		 			var con = this.makeDescription(subelem, title, depth+1);
					if(con){
						d += con.desc;
						if(typeof con.title!="undefined" && con.title){
						 	title = con.title;
							if(title.length > this.maxtitlewidth){
								this.maxtitlewidth = title.length + depth;
								}
							}
						}
					}
				}

			}
		
		ln++;
		}
	var dc = {};
	dc.desc = d;
	dc.title = title;
	return dc;
	};

GeoXml.prototype.randomColor = function(){ 
	var color="#";
	for (var i=0;i<6;i++){
		var idx = parseInt(Math.random()*16,10)+1;
		color += idx.toString(16);
		}
	return (color.substring(0,7));
	//return color;
	};

GeoXml.prototype.handleGeomark = function (mark, idx, trans) {
     var that = this;
     var desc, title, name, style;
     title = "";
     desc = "";
     var styleid = 0;
     var lat, lon;
     var visible = true;
     if(this.hideall){visible = false;}
     var fill = true;
     var outline = true;
     var width, color, opacity, fillOpacity, fillColor;
     var cor = [];
     var node, nv, cm;
	var coords = "";
	var poslist=[];
	var point_count =0;
	var box_count=0;
	var line_count=0;
	var poly_count=0;
	var p;
	var points = [];
	var cc, l;
    var pbounds = new google.maps.LatLngBounds();
    var coordset=mark.getElementsByTagName("coordinates");
	if(coordset.length <1){
	    coordset=mark.getElementsByTagName("gml:coordinates");
	    }
	if(coordset.length <1){
	   	coordset = [];
	    	poslist =mark.getElementsByTagName("gml:posList");
		if(poslist.length <1) { poslist = mark.getElementsByTagName("posList"); }
		for(l =0;l<poslist.length;l++){
			coords = " ";
			cor = this.getText(poslist.item(l)).split(' ');
			if(that.isWFS){
			for(cc=0;cc<(cor.length-1);cc++){
					if(cor[cc] && cor[cc]!=" " && !isNaN(parseFloat(cor[cc]))){
						coords += ""+parseFloat(cor[cc])+","+parseFloat(cor[cc+1]);
						coords += " ";
						cc++;
						}
					}
				}
			else {
				for(cc=0;cc<(cor.length-1);cc++){
					if(cor[cc] && cor[cc]!=" " && !isNaN(parseFloat(cor[cc]))){
						coords += ""+parseFloat(cor[cc+1])+","+parseFloat(cor[cc]);
						coords += " ";
						cc++;
						}
					}
				}
			if(coords){
 				if(poslist.item(l).parentNode && (poslist.item(l).parentNode.nodeName == "gml:LineString") ){ line_count++; }
					else { poly_count++; }
				cm = "<coordinates>"+coords+"</coordinates>";
				node = this.parseXML(cm);
				if(coordset.push){ coordset.push(node); }
				}
			}

		var pos = mark.getElementsByTagName("gml:pos");
		if(pos.length <1){ pos = mark.getElementsByTagName("gml:pos"); }
		if(pos.length){
			for(p=0;p<pos.length;p++){
				nv = this.getText(pos.item(p));
				cor = nv.split(" ");
				if(!that.isWFS){
					node = this.parseXML("<coordinates>"+cor[1]+","+cor[0]+"</coordinates>");
					}
				else {
					node = this.parseXML("<coordinates>"+cor[0]+","+cor[1]+"</coordinates>");
					}
				if(coordset.push){ coordset.push(node); }
				}
			}
	    }

	var newcoords = false;
	point_count =0;
	box_count=0;
	line_count=0;
	poly_count=0;
     
	var dc = that.makeDescription(mark,"");
	desc = "<div id='currentwindow' style='overflow:auto;height:"+this.iwheight+"px' >"+dc.desc+"</div> ";
	if(!name && dc.title){
		name = dc.title;
		if(name.length > this.maxtitlewidth){
			this.maxtitlewidth = name.length;
			}
		}
	     
    
     if(newcoords && typeof lat!="undefined"){
		coordset.push(""+lon+","+lat);
		}
    
     var lines = [];
	 var polygonlines = [];
     var point;
     var skiprender;
     var bits;
	  
     for(var c=0;c<coordset.length;c++){
        skiprender = false;
        if (coordset[c].parentNode && (coordset[c].parentNode.nodeName == "gml:Box" || coordset[c].parentNode.nodeName == "gml:Envelope")) {
            skiprender = true;
            }
       
       coords = this.getText(coordset[c]); 
       coords += " ";
       coords=coords.replace(/\s+/g," "); 
          // tidy the whitespace
       coords=coords.replace(/^ /,"");    
          // remove possible leading whitespace
       coords=coords.replace(/, /,",");   
          // tidy the commas
       var path = coords.split(" ");
          // Is this a polyline/polygon?
          
     if (path.length == 1 || path[1] =="") {
            bits = path[0].split(",");
            point = new google.maps.LatLng(parseFloat(bits[1])/trans.ys-trans.y,parseFloat(bits[0])/trans.xs-trans.x);
            that.bounds.extend(point);
            // Does the user have their own createmarker function?
	    if(!skiprender){
		    if(typeof name == "undefined"){ name= that.unnamedplace; }
        	    if (!!that.opts.createmarker) {
          		    that.opts.createmarker(point, name, desc, styleid, idx, null, visible);
        		    } 
		    else {
          		    that.createMarker(point, name, desc, styleid, idx, null, visible);
        		    }
		    }
	    }
      else {
        // Build the list of points
       	for (p=0; p<path.length-1; p++) {
         	 bits = path[p].split(",");
         	 point = new google.maps.LatLng(parseFloat(bits[1])/trans.ys-trans.y,parseFloat(bits[0])/trans.xs-trans.x);
         	 points.push(point);
         	 pbounds.extend(point);
         	 }
	 	that.bounds.extend(pbounds.getNorthEast());
	 	that.bounds.extend(pbounds.getSouthWest());
		if(!skiprender) { lines.push(points); }
	     }
	}
 	if(!lines || lines.length <1) { return; }
        var linestring=mark.getElementsByTagName("LineString");
	    if(linestring.length <1){
		linestring=mark.getElementsByTagName("gml:LineString");
		}
        if (linestring.length || line_count>0) {
          // its a polyline grab the info from the style
          if (!!style) {
            width = style.strokeWeight; 
            color = style.strokeColor; 
            opacity = style.strokeOpacity; 
          } else {
            width = this.style.width;
            color = this.style.color;
            opacity = this.style.opacity;
          }
          // Does the user have their own createpolyline function?
	  if(typeof name == "undefined"){ name=that.unnamedpath; }
          if (!!that.opts.createpolyline) {
            that.opts.createpolyline(lines,color,width,opacity,pbounds,name,desc,idx,visible);
          } else {
            that.createPolyline(lines,color,width,opacity,pbounds,name,desc,idx,visible);
          }
        }
        var polygons=mark.getElementsByTagName("Polygon");
	if(polygons.length <1){
		polygons=mark.getElementsByTagName("gml:Polygon");
		}

        if (polygons.length || poly_count>0) {
          // its a polygon grab the info from the style
          if (!!style) {
            width = style.strokeWeight; 
            color = style.strokeColor; 
            opacity = style.strokeOpacity; 
            fillOpacity = style.fillOpacity; 
            fillColor = style.fillColor; 
            fill = style.fill;
			outline = style.outline;
          } 
	fillColor = this.randomColor();
	color = this.randomColor();
	fill = 1;
	outline = 1;
	//alert("found Polygon");
	if(typeof name == "undefined"){ name=that.unnamedarea; }
 	if (!!that.opts.createpolygon) {
            that.opts.createpolygon(lines,color,width,opacity,fillColor,fillOpacity,pbounds,name,desc,idx,visible,fill,outline);
          } else {
            that.createPolygon(lines,color,width,opacity,fillColor,fillOpacity,pbounds,name,desc,idx,visible,fill,outline);
          }
      }  
    };
	

GeoXml.prototype.handlePlacemark = function(mark, idx, depth, fullstyle) {
		var mgeoms = mark.getElementsByTagName("MultiGeometry");
		if(mgeoms.length < 1){
			this.handlePlacemarkGeometry(mark,mark,idx,depth,fullstyle);
			}
		else {
			var p;
			var pts = mgeoms[0].getElementsByTagName("Point");
			for (p=0;p<pts.length; p++){
				this.handlePlacemarkGeometry(mark,pts[p],idx,depth,fullstyle);
				}
			var lines = mgeoms[0].getElementsByTagName("LineString");
			for (p=0;p<lines.length; p++){
				this.handlePlacemarkGeometry(mark,lines[p],idx,depth,fullstyle);
				}
			var polygons = mgeoms[0].getElementsByTagName("Polygon");
			for (p=0;p<polygons.length; p++){
				this.handlePlacemarkGeometry(mark,polygons[p],idx,depth,fullstyle);
				}
			}		
		};
	
GeoXml.prototype.handlePlacemarkGeometry = function(mark, geom, idx, depth, fullstyle) {
        var that = this;
        var desc, title, name, style;
        title = "";
        desc = "";
        var styleid = 0;
        var lat, lon;
        var visible = true;
        if (this.hideall) { visible = false; }
        var newcoords = false;
        var outline;
        var opacity;
        var fillcolor;
        var fillOpacity;
        var color;
        var width;
        var pbounds;
        var fill;
        var points = [];
        var lines = [];
        var bits = [];
        var point;
        var cor, node, cm, nv;
        var l, pos, p, j, k, cc;
        var kml_id = mark.getAttribute("id");
        var point_count = 0;
        var box_count = 0;
        var line_count = 0;
        var poly_count = 0;
        var coords = "";
        var markerurl = "";
        var snippet = "";
        l = mark.getAttribute("lat");
        if (typeof l != "undefined") { lat = l; }
        l = mark.getAttribute("lon");
        if (typeof l != "undefined") {
            newcoords = true;
            lon = l;
			}
        l = 0;
        var coordset = geom.getElementsByTagName("coordinates");
        if (coordset.length < 1) {
            coordset = geom.getElementsByTagName("gml:coordinates");
			}
        if (coordset.length < 1) {
            coordset = [];
            var poslist = geom.getElementsByTagName("gml:posList");
            if (!poslist.length) {
                poslist = geom.getElementsByTagName("posList");
            }
            for (l = 0; l < poslist.length; l++) {
                coords = " ";
                var plitem = this.getText(poslist.item(l)) + " ";
                plitem = plitem.replace(/(\s)+/g, ' ');
                cor = plitem.split(' ');
                if (that.isWFS) {
                    for (cc = 0; cc < (cor.length - 1); cc++) {
                        if (!isNaN(parseFloat(cor[cc])) && !isNaN(parseFloat(cor[cc + 1]))) {
                            coords += "" + parseFloat(cor[cc]) + "," + parseFloat(cor[cc + 1]);
                            coords += " ";
                            cc++;
                        }
                    }
                }
                else {
                    for (cc = 0; cc < (cor.length - 1); cc++) {
                        if (!isNaN(parseFloat(cor[cc])) && !isNaN(parseFloat(cor[cc + 1]))) {
                            coords += "" + parseFloat(cor[cc + 1]) + "," + parseFloat(cor[cc]);
                            coords += " ";
                            cc++;
                        }
                    }
                }
                if (coords) {
                    if (poslist.item(l).parentNode && (poslist.item(l).parentNode.nodeName == "gml:LineString")) { line_count++; }
                    else { poly_count++; }
                    cm = "<coordinates>" + coords + "</coordinates>";
                    node = this.parseXML(cm);
                    if (coordset.push) { coordset.push(node); }
                }
            }

            pos = geom.getElementsByTagName("gml:pos");
            if (pos.length < 1) { pos = geom.getElementsByTagName("gml:pos"); }
            if (pos.length) {
                for (p = 0; p < pos.length; p++) {
                    nv = this.getText(pos.item(p)) + " ";
                    cor = nv.split(' ');
                    if (!that.isWFS) {
                        node = this.parseXML("<coordinates>" + cor[1] + "," + cor[0] + "</coordinates>");
                    }
                    else {
                        node = this.parseXML("<coordinates>" + cor[0] + "," + cor[1] + "</coordinates>");
                    }
                    if (coordset.push) { coordset.push(node); }
                }
            }
        }




        for (var ln = 0; ln < mark.childNodes.length; ln++) {
            var nn = mark.childNodes.item(ln).nodeName;
            nv = this.getText(mark.childNodes.item(ln));
            var ns = nn.split(":");
            var base;
            if (ns.length > 1) { base = ns[1].toLowerCase(); }
            else { base = ns[0].toLowerCase(); }

            var processme = false;
            switch (base) {
                case "name":
                    name = nv;
                    if (name.length + depth > this.maxtitlewidth) { this.maxtitlewidth = name.length + depth; }
                    break;
                case "title":
                    title = nv;
                    if (title.length + depth > this.maxtitlewidth) { this.maxtitlewidth = title.length + depth; }
                    break;
                case "desc":
                case "description":
                    desc = GeoXml.getDescription(mark.childNodes.item(ln));
                    if (!desc) { desc = nv; }
					var srcs = desc.match(/src=\"(.*)\"/i);
			//alert("matching srcs : "+srcs.index + " "+srcs.input);
					if(srcs){
						for (var sr=1;sr<srcs.length;sr++){
							if(srcs[sr].match(/^http/)){
								}
							else {
								if(this.url.match(/^http/)){
									//remove all but last slash of url
									var slash = this.url.lastIndexOf("/");
									if(slash != -1){
										newsrc = this.url.substring(0,slash)+"/" + srcs[sr];
										desc = desc.replace(srcs[sr],newsrc);
										}
									//alert(desc);
									}
								else {
									//compute directory of html add relative path of kml and relative path of src.
									var slash = this.url.lastIndexOf("/");
									if(slash != -1){
										newsrc = this.url.substring(0,slash)+"/" + srcs[sr];
										desc = desc.replace(srcs[sr],newsrc);
										}
									//var path = window.location.href+" "+this.url+" "+srcs[sr];
									//alert(path +"\n"+desc);
									}
								}
							}
						}
                    if (that.opts.preloadHTML && desc && desc.match(/<(\s)*img/i)) {
                        var preload = document.createElement("span");
                        preload.style.visibility = "visible";
                        preload.style.position = "absolute";
                        preload.style.left = "-1200px";
                        preload.style.top = "-1200px";
                        preload.style.zIndex = this.overlayman.markers.length;
                        document.body.appendChild(preload);
                        preload.innerHTML = desc;
						}
                    if (desc.match(/^http:\/\//i)) {
                        var flink = desc.split(/(\s)+/);
                        if (flink.length > 1) {
                            desc = "<a href=\"" + flink[0] + "\">" + flink[0] + "</a>";
                            for (var i = 1; i < flink.length; i++) {
                                desc += flink[i];
                            }
                        }
                        else {
                            desc = "<a href=\"" + desc + "\">" + desc + "</a>";
                        }
                    }
                    break;
                case "visibility":
                    if (nv == "0") { visible = false; }
                    break;
                case "Snippet":
                case "snippet":
                    snippet = nv;
                    break;
                case "href":
                case "link":
                    if (nv) {
                        desc += "<p><a target='_blank' href='" + nv + "'>link</a></p>";
                        markerurl = nv;
                    }
                    else {
                        var href = mark.childNodes.item(ln).getAttribute("href");
                        if (href) {
                            var imtype = mark.childNodes.item(ln).getAttribute("type");
                            if (imtype && imtype.match(/image/)) {
                                desc += "<img style=\"width:256px\" src='" + href + "' />";
                            }
                            markerurl = href;
                        }
                    }
                    break;
                case "author":
                    desc += "<p><b>author:</b>" + nv + "</p>";
                    break;
                case "time":
                    desc += "<p><b>time:</b>" + nv + "</p>";
                    break;
                case "lat":
                    lat = nv;
                    break;
                case "long":
                    lon = nv;
                    newcoords = true;
                    break;
                case "box":
                    box_count++; processme = true; break;
                case "styleurl":
                    styleid = nv;
					var currstyle = style;
					style = that.styles[styleid];
                    break;
                case "stylemap":
                    var found = false;
                    node = mark.childNodes.item(ln);
                    for (j = 0; (j < node.childNodes.length && !found); j++) {
                        var pair = node.childNodes[j];
                        for (k = 0; (k < pair.childNodes.length && !found); k++) {
                            var pn = pair.childNodes[k].nodeName;
                            if (pn == "Style") {
                                style = this.handleStyle(pair.childNodes[k],null,style);
                                found = true;
                            }
                        }
                    }
					
                    break;
                case "Style":
                case "style":
                    styleid = null;
                    style = this.handleStyle(mark.childNodes.item(ln),null,style);
                    break;
            }
            if (processme) {
                cor = nv.split(' ');
                coords = "";
                for (cc = 0; cc < (cor.length - 1); cc++) {
                    if (!isNaN(parseFloat(cor[cc])) && !isNaN(parseFloat(cor[cc + 1]))) {
                        coords += "" + parseFloat(cor[cc + 1]) + "," + parseFloat(cor[cc]);
                        coords += " ";
                        cc++;
                    }
                }
                if (coords != "") {
                    node = this.parseXML("<coordinates>" + coords + "</coordinates>");
                    if (coordset.push) { coordset.push(node); }
                }
            }

        }

        if (!name && title) { name = title; }

        if (fullstyle) {
			alert("overriding style with" +fullstyle.url);
            style = fullstyle;
			}
	  var iwheightstr;
		if (this.iwheight != 0){
			iwheightstr = "height:"+this.iwheight+"px";
			}
        if (typeof desc == "undefined" || !desc || this.opts.makedescription) {
            var dc = that.makeDescription(mark, "");
			
            desc = "<div id='currentpopup' style='overflow:auto;" + iwheightstr + "' >" + dc.desc + "</div> ";
            if (!name && dc.title) {
                name = dc.title;
                if ((name.length + depth) > this.maxtitlewidth) {
                    this.maxtitlewidth = name.length + depth;
                }
            }
        }
		else {
			if(this.iwheight){
				desc = "<div id='currentpopup' style='overflow:auto;" + iwheightstr+"' >" + desc + "</div> ";
				}
			}

        if (newcoords && typeof lat != "undefined") {
            if (lat) {
                var cs = "" + lon + "," + lat + " ";
                node = this.parseXML("<coordinates>" + cs + "</coordinates>");
                coordset.push(node);
            }
        }



        for (var c = 0; c < coordset.length; c++) {
            var skiprender = false;
            if (coordset[c].parentNode && (coordset[c].parentNode.nodeName.match(/^(gml:Box|gml:Envelope)/i))) {
                skiprender = true;
				}
            coords = this.getText(coordset[c]);
            coords += " ";
            coords = coords.replace(/(\s)+/g, " ");
            // tidy the whitespace
            coords = coords.replace(/^ /, "");
            // remove possible leading whitespace
            //coords=coords +" "; 
            ////ensure trailing space
            coords = coords.replace(/, /, ",");
            // tidy the commas
            var path = coords.split(" ");
            // Is this a polyline/polygon?

            if (path.length == 1 || path[1] == "") {
					bits = path[0].split(",");
					point = new google.maps.LatLng(parseFloat(bits[1]), parseFloat(bits[0]));
					this.overlayman.folderBounds[idx].extend(point);
					// Does the user have their own createmarker function?
					if (!skiprender) {
						if (typeof name == "undefined") { name = that.unnamedplace; }
						if (!!that.opts.createmarker) {
							that.opts.createmarker(point, name, desc, styleid, idx, style, visible, kml_id, markerurl, snippet);
						}
						else {
							that.createMarker(point, name, desc, styleid, idx, style, visible, kml_id, markerurl, snippet);
						}
					}
				}
            else {
                // Build the list of points
                points = [];
                pbounds = new google.maps.LatLngBounds();
                for (p = 0; p < path.length - 1; p++) {
                    bits = path[p].split(",");
                    point = new google.maps.LatLng(parseFloat(bits[1]), parseFloat(bits[0]));
                    points.push(point);
                    pbounds.extend(point);
					}
                this.overlayman.folderBounds[idx].extend(pbounds.getSouthWest());
                this.overlayman.folderBounds[idx].extend(pbounds.getNorthEast());
                this.bounds.extend(pbounds.getSouthWest());
                this.bounds.extend(pbounds.getNorthEast());
                if (!skiprender) { lines.push(points); }
            }
        }
        if (!lines || lines.length < 1) { return; }
		var nn = coordset[0].parentNode.nodeName;
        if (nn.match(/^(LineString)/i)||nn.match(/^(gml:LineString)/i)) {
            // its a polyline grab the info from the style
            if (!!style) {
                width = style.strokeWeight;
                color = style.strokeColor;
                opacity = style.strokeOpacity;
            } else {
                width = this.style.width;
                color = this.style.color;
                opacity = this.style.opacity;
            }
            // Does the user have their own createmarker function?
            if (typeof name == "undefined") { name = unnamedpath; }
            if (!!that.opts.createpolyline) {
                that.opts.createpolyline(lines, color, width, opacity, pbounds, name, desc, idx, visible, kml_id);
            } else {
                that.createPolyline(lines, color, width, opacity, pbounds, name, desc, idx, visible, kml_id);
            }
        }
	//	alert(coordset[0].parentNode.nodeName);
        if (nn.match(/^(LinearRing)/i) || nn.match(/^(gml:LinearRing)/i)) {
            // its a polygon grab the info from the style
            if (!!style) {
                width = style.strokeWeight;
                color = style.strokeColor;
                opacity = style.strokeOpacity;
                fillOpacity = style.fillOpacity;
                fillcolor = style.fillColor;
                fill = style.fill;
                outline = style.outline;
				}	
            if (typeof fill == "undefined") { fill = 0; }
            if (typeof color == "undefined") { color = this.style.color; }
            if (typeof fillcolor == "undefined") { fillcolor = this.randomColor(); }
            if (typeof name == "undefined") { name = that.unnamedarea; }
            if (!!that.opts.createpolygon) {
                that.opts.createpolygon(lines, color, width, opacity, fillcolor, fillOpacity, pbounds, name, desc, idx, visible, fill, outline, kml_id);
            } else {
                that.createPolygon(lines, color, width, opacity, fillcolor, fillOpacity, pbounds, name, desc, idx, visible, fill, outline, kml_id);
            }
        }
    };
GeoXml.prototype.makeIcon = function(currstyle, href, myscale, hotspot){
	var scale = 1;
	var tempstyle;
	var anchorscale = {x:0.5,y:0.5};
	if(hotspot){
		var xu = hotspot.getAttribute("xunits");
		var x = hotspot.getAttribute("x");
		var thtwox = 32; 
		var thtwoy = 32;
		if(this.opts.baseicon) {
			thtwox = this.opts.baseicon.size.width;
			thtwoy = this.opts.baseicon.size.height;
			}
		if(xu == "fraction"){
			anchorscale.x = parseFloat(x);
			}
		else {
			anchorscale.x = parseFloat(x)/thtwox;
			}
		var yu = hotspot.getAttribute("yunits");
		var y = hotspot.getAttribute("y");
		if(yu == "fraction"){
			anchorscale.y = 1 - parseFloat(y);
			}
		else {
			anchorscale.y = 1 - parseFloat(y)/thtwoy;
			}		
		}
	 
	if(typeof myscale == "number"){
		scale = myscale;
		}
	if (!!href) { }
	else {
		if(!!currstyle){
			if(!!currstyle.url){
				href = currstyle.url; 
				scale = currstyle.scale;
				}
			}
		else {
			href = "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png";
			tempstyle = new google.maps.MarkerImage(href,new google.maps.Size(16*scale,16*scale));
			tempstyle.origin = new google.maps.Point(0*scale,0*scale);
			tempstyle.anchor = new google.maps.Point(16*scale*anchorscale.x,16*scale*anchorscale.y);
			}
		}
	if (!!href) {
		  if (!!this.opts.baseicon) {
		  var bicon = this.opts.baseicon;
		   tempstyle = new google.maps.MarkerImage(href,this.opts.baseicon.size);
		   tempstyle.origin = this.opts.baseicon.origin;
		   tempstyle.anchor = new google.maps.Point(this.opts.baseicon.size.width*scale*anchorscale.x,this.opts.baseicon.size.height*scale*anchorscale.y);
		   if(this.opts.baseicon.scaledSize){
				tempstyle.scaledSize = this.opts.baseicon.scaledSize;
				}
			else {
				var w = bicon.size.width*scale;
				var h = bicon.size.height*scale;
				tempstyle.scaledSize = new google.maps.Size(w,h);
				}
		   tempstyle.url = href;
		  } else {
			tempstyle = new google.maps.MarkerImage(href,new google.maps.Size(32,32),new google.maps.Point(0,0),new google.maps.Point(32*scale*anchorscale.x,32*scale*anchorscale.y),new google.maps.Size(32*scale,32*scale));
			if (this.opts.printgif) {
			  var bits = href.split("/");
			  var gif = bits[bits.length-1];
			  gif = this.opts.printgifpath + gif.replace(/.png/i,".gif");
			  tempstyle.printImage = gif;
			  tempstyle.mozPrintImage = gif;
				}
			if (!!this.opts.noshadow) { //shadow image code probably needs removed 
			  tempstyle.shadow="";
			} else {
			  // Try to guess the shadow image
			  if (href.indexOf("/red.png")>-1 
			   || href.indexOf("/blue.png")>-1 
			   || href.indexOf("/green.png")>-1 
			   || href.indexOf("/yellow.png")>-1 
			   || href.indexOf("/lightblue.png")>-1 
			   || href.indexOf("/purple.png")>-1
		|| href.indexOf("/orange.png")>-1 
			   || href.indexOf("/pink.png")>-1 
		|| href.indexOf("-dot.png")>-1 ) {
				  tempstyle.shadow="http://maps.google.com/mapfiles/ms/icons/msmarker.shadow.png";
			  }
			  else if (href.indexOf("-pushpin.png")>-1  
		|| href.indexOf("/pause.png")>-1 
		|| href.indexOf("/go.png")>-1    
		|| href.indexOf("/stop.png")>-1     ) {
				  tempstyle.shadow="http://maps.google.com/mapfiles/ms/icons/pushpin_shadow.png";
			  }
			  else {
				var shadow = href.replace(".png",".shadow.png");
		if(shadow.indexOf(".jpg")){ shadow =""; }
				tempstyle.shadow=shadow;
			  }
			}
		  }
		}
	
	if (this.opts.noshadow){
		tempstyle.shadow ="";
		}
	return tempstyle;
	};
	
GeoXml.prototype.handleStyle = function(style,sid,currstyle){
	 var that = this;
      var icons=style.getElementsByTagName("IconStyle");
      var tempstyle,opacity;
      var aa,bb,gg,rr;
      var fill,href,color,colormode, outline;
	  fill = 1;
	  outline = 0;
	  myscale = 1;
	  var strid = "#";
	  if(sid){
		strid = "#"+sid;
		}
	  //tempstyle.url = currstyle.url;
	  
      if (icons.length > 0) {
        href=this.getText(icons[0].getElementsByTagName("href")[0]);
		if(!!!href){
			href = currstyle.url;
			}
		var scale = parseFloat(this.getText(icons[0].getElementsByTagName("scale")[0]),10);
		if(scale){
			myscale = scale;
			}
		var hs = icons[0].getElementsByTagName("hotSpot");
		tempstyle = this.makeIcon(currstyle,href,myscale,hs[0]);
		tempstyle.scale = myscale;
		that.styles[strid] = tempstyle;
      	}
      // is it a LineStyle ?
      var linestyles=style.getElementsByTagName("LineStyle");
      if (linestyles.length > 0) {
        var width = parseInt(this.getText(linestyles[0].getElementsByTagName("width")[0]),10);
        if (width < 1) {width = 1;}
        color = this.getText(linestyles[0].getElementsByTagName("color")[0]);
        aa = color.substr(0,2);
        bb = color.substr(2,2);
        gg = color.substr(4,2);
        rr = color.substr(6,2);
        color = "#" + rr + gg + bb;
        opacity = parseInt(aa,16)/256;
		if(that.opts.overrideOpacity){
			opacity = that.opts.overrideOpacity;
			}
        if (!!!that.styles[strid]) {
          that.styles[strid] = {};
        1}
        that.styles[strid].strokeColor=color;
        that.styles[strid].strokeWeight=width;
        that.styles[strid].strokeOpacity=opacity;
      }
      // is it a PolyStyle ?
      var polystyles=style.getElementsByTagName("PolyStyle");
      if (polystyles.length > 0) {
       
        
        color = this.getText(polystyles[0].getElementsByTagName("color")[0]);
        colormode = this.getText(polystyles[0].getElementsByTagName("colorMode")[0]);
        if (polystyles[0].getElementsByTagName("fill").length != 0) {
			fill = parseInt(this.getText(polystyles[0].getElementsByTagName("fill")[0]),10);
			}
        if (polystyles[0].getElementsByTagName("outline").length != 0) {
			outline = parseInt(this.getText(polystyles[0].getElementsByTagName("outline")[0]),10);
			}
        aa = color.substr(0,2);
        bb = color.substr(2,2);
        gg = color.substr(4,2);
        rr = color.substr(6,2);
        color = "#" + rr + gg + bb;
        opacity = parseInt(aa,16)/256;
		if(that.opts.overrideOpacity){
			opacity = that.opts.overrideOpacity;
			}

        if (!!!that.styles[strid]) {
          that.styles[strid] = {};
        }
		that.styles[strid].fill = fill;
		that.styles[strid].outline = outline;
		if(colormode != "random") {
			that.styles[strid].fillColor = color;
			}
		else {
			that.styles[strid].colortint = color;
			}
			that.styles[strid].fillOpacity=opacity;
			if (!fill) { that.styles[strid].fillOpacity = 0; }
			if (!outline) { that.styles[strid].strokeOpacity = 0; }
		  }
	  
	tempstyle = that.styles[strid];

	return tempstyle;
};
GeoXml.prototype.processKML = function(node, marks, title, sbid, depth, paren) {  
	var that = this;
	var thismap = this.map;
	var icon;
	var grouptitle;
	var keepopen = this.forcefoldersopen;
	if (node.nodeName == "kml"){ icon = this.docicon; }
        if (node.nodeName == "Document" ){ 
		icon = this.kmlicon;  
		}
	if (node.nodeName == "Folder"){  
		icon = this.foldericon; 
		grouptitle = title; 
		}
	var pm = [];
	var sf = [];
	var desc= "";
	var snippet ="";
	var i;
	var visible = false;
	if(!this.hideall){visible = true; }
	var boundsmodified = false;
        var networklink = false;
	var url;
	var ground = null;
	var opacity = 1.0;
	var wmsbounds;
	var makewms = false;
	var wmslist = [];
	var mytitle;
	var color;
	var ol;
	var n,ne,sw,se;
	var html; 
	var kml_id = node.getAttribute("id");
	for (var ln = 0; ln < node.childNodes.length; ln++) {
		var nextn = node.childNodes.item(ln);
		var nn = nextn.nodeName;
		var nv = nextn.nodeValue;
		switch (nn) {
		 	case "name":  
			case "title": 
				title = this.getText(nextn);
				if(title.length + depth > this.maxtitlewidth){ this.maxtitlewidth = title.length+depth;	}
			 	break;
			case "Folder" :
			case "Document" :
				sf.push(nextn); 
				break;
		 	case "GroundOverlay":
				url=this.getText(nextn.getElementsByTagName("href")[0]);
				var north=parseFloat(this.getText(nextn.getElementsByTagName("north")[0]));
				var south=parseFloat(this.getText(nextn.getElementsByTagName("south")[0]));
				var east=parseFloat(this.getText(nextn.getElementsByTagName("east")[0]));
				var west=parseFloat(this.getText(nextn.getElementsByTagName("west")[0]));
				var attr = this.getText(nextn.getElementsByTagName("attribution")[0]);
				sw = new google.maps.LatLng(south,west);
				ne = new google.maps.LatLng(north,east); 
				this.bounds.extend(sw); 
      			this.bounds.extend(ne);
				color=this.getText(nextn.getElementsByTagName("color")[0]);
				opacity = parseInt(color.substring(1,3),16)/256;
				mytitle = this.getText(nextn.getElementsByTagName("name")[0]);
				var arcims = /arcimsproxy/i; 
				if(url.match(arcims)) {
					url += "&bbox="+west+","+south+","+east+","+north+"&response=img";
					wmsbounds = new google.maps.LatLngBounds(sw,ne);
					makewms = true;
					ol = this.makeWMSTileLayer(url, visible, mytitle, opacity, attr, title, wmsbounds);
					if(ol) {
						ol.bounds = wmsbounds;
						ol.title = mytitle;
						ol.opacity = opacity;
						ol.visible = visible;
						ol.url = url;
						if(!this.quiet){ 
							this.mb.showMess("Adding Tiled ArcIms Overlay "+title,1000); 
							}
						wmslist.push(ol);
						}
					}
				else { 
				var rs = /request=getmap/i;    
				if(url.match(rs)){
					url += "&bbox="+west+","+south+","+east+","+north;
					wmsbounds = new google.maps.LatLngBounds(sw,ne);
					makewms = true;
					ol = this.makeWMSTileLayer(url, visible, mytitle, opacity, attr, title, wmsbounds);
					if(ol){ 
						ol.bounds = wmsbounds;
						ol.title = mytitle;
						ol.opacity = opacity;
						ol.visible = visible;
						ol.url = url;
						if(!this.quiet){ this.mb.showMess("Adding Tiled WMS Overlay "+title,1000);}
						wmslist.push(ol);
						}	
					}
				else {
					wmsbounds = new google.maps.LatLngBounds(sw,ne);
      				ground = new GGroundOverlay(url, wmsbounds);
					ground.bounds = wmsbounds;
					ground.getBounds = function(){ return this.bounds;};
					boundsmodified = true;
					makewms = false;
      			 	}
				}
				break;
		 	case "NetworkLink":
			       url = this.getText(nextn.getElementsByTagName("href")[0]);
				networklink = true;
				break;
			case "description" :
			case "Description":
				desc = GeoXml.getDescription(nextn);
				break;
			case "open":
				if(this.getText(nextn) == "1"){  keepopen = true; }
				if(this.getText(nextn) == "0") { keepopen = this.forcefoldersopen; }
				break;
			case "visibility":
				if(this.getText(nextn) == "0") { visible = false; }
				break;
			case "snippet" :
			case "Snippet" :
				snippet = GeoXml.stripHTML(this.getText(nextn));
				snippet = snippet.replace(/\n/g,'');
				break;
			default:
				for(var k=0;k<marks.length;k++){
					if(nn == marks[k]){
						pm.push(nextn);
						}					
					}
				}
			}

  
	var folderid;

	var idx = this.overlayman.folders.length;
	var me = paren;
	if(sf.length >1 || pm.length || ground || makewms ){
        	this.overlayman.folders.push([]);
		this.overlayman.subfolders.push([]);
    		this.overlayman.folderhtml.push([]);
    		this.overlayman.folderhtmlast.push(0);
		this.overlayman.folderBounds.push(new google.maps.LatLngBounds());
  		this.kml.push(new KMLObj(title, desc, false, idx));
		me = this.kml.length - 1;
		folderid = this.createFolder(idx, title, sbid, icon, desc, snippet, true, visible);
		} 
	else {
		folderid = sbid;
		}


	if (node.nodeName == "Folder" || node.nodeName == "Document"){  
		this.kml[me].open = keepopen; 
		this.kml[me].folderid = folderid;
		}

	if(ground || makewms){
		this.kml[this.kml.length-1].visibility = visible;
		this.kml[this.kml.length-1].groundOverlays.push({"url":url,"bounds":wmsbounds});
		}
	 

	if(networklink){
		var re = /&amp;/g;
		url = url.replace(re,"&");
		var nl = /\n/g;
		url = url.replace(nl,"");
 		this.progress++;	
		if(!topwin.standalone){
			if(typeof this.proxy!="undefined") { url = this.proxy + escape(url); } 
			}
	 	var comm = this.myvar +".loadXMLUrl('"+url+"','"+title+"',null,null,'"+sbid+"');";
		setTimeout(comm,1000);
		return;
		}

	if(makewms && wmslist.length){
		for(var wo=0;wo<wmslist.length;wo++) {
			var ol = wmslist[wo];
			var blob = "";
			if (this.basesidebar) {
    				var n = this.overlayman.markers.length;
				if(!this.nolegend){
					var myurl = ol.url.replace(/height=(\d)+/i,"height=100");
					myurl = myurl.replace(/width=(\d)+/i,"width=100");
					blob = '<img src="'+myurl+'" style="width:100px" />';
					}
				}
			if(this.sidebarsnippet && snippet==""){
				snippet = GeoXml.stripHTML(desc);
				desc2 = desc2.substring(0,40);}
   			parm =  this.myvar+"$$$" +ol.title + "$$$tiledoverlay$$$" + n +"$$$" + blob + "$$$" +ol.visible+"$$$"+(this.baseLayers.length-1)+"$$$"+snippet; 
			var html = ol.desc;
			var thismap = this.map; 
			google.maps.event.addListener(ol,"zoomto", function() { 	
				thismap.fitBounds(this.getBounds());
				});	
	 		this.overlayman.AddMarker(ol, title, idx, parm, true, true); 
			}
		}
	
	if(ground){
		if (this.basesidebar) {
    			var n = this.overlayman.markers.length;
    			var blob = '<span style="background-color:black;border:2px solid brown;">&nbsp;&nbsp;&nbsp;&nbsp;</span> ';
			if(this.sidebarsnippet && snippet==""){
				snippet = GeoXml.stripHTML(desc);
				desc2 = desc2.substring(0,40);}
   			parm =  this.myvar+"$$$" +title + "$$$polygon$$$" + n +"$$$" + blob + "$$$" +visible+"$$$null$$$"+snippet; 
   		 
			var html = desc;
			var thismap = this.map;
			google.maps.event.addListener(ground,"zoomto", function() { 
						thismap.fitBounds(ground.getBounds());
						});
			this.overlayman.folderBounds[idx].extend(ground.getBounds().getSouthWest());
			this.overlayman.folderBounds[idx].extend(ground.getBounds().getNorthEast());
			boundsmodified = true;
			this.overlayman.AddMarker(ground,title,idx, parm, visible);
			}
		ground.setMap(this.map);
		}


	for(i=0;i<pm.length;i++) {
		this.handlePlacemark(pm[i], idx, depth+1);
		}
	var fc = 0;

	for(i=0;i<sf.length;i++) {
	 	 var fid = this.processKML(sf[i], marks, title, folderid, depth+1, me);
		 if(typeof fid =="number" && fid != idx){
			var sub = this.overlayman.folderBounds[fid];
			if(!sub) { 
			       this.overlayman.folderBounds[fid] = new google.maps.LatLngBounds(); 
				}
			 else {
			        var sw = this.overlayman.folderBounds[fid].getSouthWest();
			        var ne = this.overlayman.folderBounds[fid].getNorthEast();
			        this.overlayman.folderBounds[idx].extend(sw);
			        this.overlayman.folderBounds[idx].extend(ne);
			        }
			this.overlayman.subfolders[idx].push(fid);
		    if(fid!=idx){ this.kml[idx].folders.push(fid); }
			fc++;
			}
		}
	 
	if(fc || pm.length || boundsmodified){
		this.bounds.extend(this.overlayman.folderBounds[idx].getSouthWest());
		this.bounds.extend(this.overlayman.folderBounds[idx].getNorthEast());
		}

	if(sf.length == 0 && pm.length == 0 && !this.opts.basesidebar){
		this.ParseURL();
		}
	return idx;
	};


GeoXml.prototype.processGPX = function(node,title,sbid,depth) {
	var icon;
	if(node.nodeName == "gpx" ){ icon = this.gmlicon; }
	if(node.nodeName == "rte" || node.nodeName == "trk" || node.nodeName == "trkseg" ){ icon = this.foldericon; }
	var pm = [];
	var sf = [];
	var desc= "";
	var snip ="";
	var i, lon, lat, l;
	var open = this.forcefoldersopen;
	var coords = "";
	var visible = true;
	for (var ln = 0; ln < node.childNodes.length; ln++) {
		var nextn = node.childNodes.item(ln);
		var nn = nextn.nodeName;
		if(nn == "name" || nn == "title"){
			title = this.getText(nextn);
			if(title.length + depth > this.maxtitlewidth){
				this.maxtitlewidth = title.length+depth;	
				}
			}
		if(nn == "rte"){
			sf.push(nextn); 
			}
		if(nn == "trk"){
			sf.push(nextn); 
			}
		if(nn == "trkseg"){
			sf.push(nextn); 
			}

		if(nn == "trkpt"){
			pm.push(nextn);
			l = nextn.getAttribute("lat");
     			if(typeof l!="undefined"){lat = l;}
     			l = nextn.getAttribute("lon");
     			if(typeof l!="undefined"){
				lon = l;
				coords += lon+","+lat+" ";
				}
			}

		if(nn == "rtept"){
			pm.push(nextn);
			l = nextn.getAttribute("lat");
     			if(typeof l!="undefined"){lat = l;}
     			l = nextn.getAttribute("lon");
     			if(typeof l!="undefined"){
				lon = l;
				coords += lon+","+lat+" ";
				}
			}
		if(nn == "wpt"){
			pm.push(nextn);
			}
		if(nn == "description" ||  nn == "desc"){
			desc = this.getText(nextn);
			}

		}

	if(coords.length){
		var nc = "<?xml version=\"1.0\"?><Placemark><name>"+title+"</name><description>"+desc+"</description><LineString><coordinates>"+coords+"</coordinates></LineString></Placemark>";
		var pathnode = this.parseXML(nc).documentElement;
		pm.push(pathnode);
		}

	var folderid;
	var idx = this.overlayman.folders.length;
	if(pm.length || node.nodeName == "gpx"){
       		this.overlayman.folders.push([]);
		this.overlayman.subfolders.push([]);
    		this.overlayman.folderhtml.push([]);
    		this.overlayman.folderhtmlast.push(0);
		this.overlayman.folderBounds.push(new google.maps.LatLngBounds());
		this.kml.push(new KMLObj(title,desc,open,idx));
		folderid = this.createFolder(idx, title, sbid, icon, desc, snip, true, visible);
		} 
 	 else {
		folderid = sbid;
		}
		

	for(i=0;i<pm.length;i++) {
		this.handlePlacemark(pm[i], idx, depth+1);
		}
	
	for(i=0;i<sf.length;i++) {
	 	var fid = this.processGPX(sf[i], title, folderid, depth+1);
		this.overlayman.subfolders[idx].push(fid);
		this.overlayman.folderBounds[idx].extend(this.overlayman.folderBounds[fid].getSouthWest());
		this.overlayman.folderBounds[idx].extend(this.overlayman.folderBounds[fid].getNorthEast());
		}

	if(this.overlayman.folderBounds[idx]){
		this.bounds.extend(this.overlayman.folderBounds[idx].getSouthWest());
		this.bounds.extend(this.overlayman.folderBounds[idx].getNorthEast());
		}

	return idx;
	};

GeoXml.prototype.ParseURL = function (){
		var query = topwin.location.search.substring(1);
		var pairs = query.split("&");
		var marks = this.overlayman.markers;
      		for (var i=0; i<pairs.length; i++) {
		var pos = pairs[i].indexOf("=");
		var argname = pairs[i].substring(0,pos).toLowerCase();
		var val = unescape(pairs[i].substring(pos+1));
		var m = 0;
		var nae;
	 	if(val){
		switch (argname) {
			case "openbyid" :
				for(m = 0;m < marks.length;m++){
				nae = marks[m].id;
				if(nae == val){
						this.overlayman.markers[m].show();
						this.overlayman.markers[m].hidden = false; 
						google.maps.event.trigger(this.overlayman.markers[m],"click");
						break;
						}	
					}	
				break;
			case "kml":
			case "url":
			case "src":
			case "geoxml":
				this.urls.push(val);
				this.parse();
			break;
			case "openbyname" :
				for(m = 0;m<marks.length;m++){
					nae = marks[m].title;
					if(nae == val){	
						this.overlayman.markers[m].show();
						this.overlayman.markers[m].hidden = false;
					 	google.maps.event.trigger(this.overlayman.markers[m],"click");
				 		break;
						}
			  	 }
			     break;
     			 }
			}
		}
	};		


GeoXml.prototype.processing = function(xmlDoc,title, latlon, desc, sbid) {
    this.overlayman.miStart = new Date();
    if(!desc){desc = title;}
    var that = this;
    if(!sbid){ sbid = 0; }
    var shadow;
    var idx;
    var root = xmlDoc.documentElement;
    if(!root){
			return 0; 
			}
    var placemarks = [];
    var name;
    var pname;
    var styles;
    var basename = root.nodeName;
    var keepopen = that.forcefoldersopen;
    var bases = basename.split(":");
    if(bases.length>1){basename = bases[1];}
    var bar, sid, i;
    that.wfs = false;
    if(basename == "FeatureCollection"){
		bar = Lance$(that.basesidebar);
		if(!title){ title = name; }
		if(typeof title == "undefined"){
			title = "Un-named GML";
			}
		that.isWFS = true;
		if(title.length > that.maxtitlewidth){
				that.maxtitlewidth = title.length;
				}
		if(bar){bar.style.display="";}
		idx = that.overlayman.folders.length;
		that.processGML(root,title,latlon,desc,(that.kml.length-1));
		that.kml[0].folders.push(idx);
		}

    if(basename =="gpx"){
	if(!title){ title = name; }
	if(typeof title == "undefined"){
		title = "Un-named GPX";
		}
        that.title = title;
	if(title.length >that.maxtitlewidth){
		that.maxtitlewidth = title.length;
		}

	bar = Lance$(that.basesidebar);
	if(bar){ bar.style.display=""; }
	idx = that.overlayman.folders.length;
	that.processGPX(root, title, that.basesidebar, sbid);
	that.kml[0].folders.push(idx);
	}
    else {

   if(basename == "kml") {	
        styles = root.getElementsByTagName("Style"); 
   	for (i = 0; i <styles.length; i++) {
    		sid= styles[i].getAttribute("id");
      		if(sid){ 
     	   		that.handleStyle(styles[i],sid);
	    		}
   	 	}
	styles = root.getElementsByTagName("StyleMap");
	for (i = 0; i <styles.length; i++) {
		sid = styles[i].getAttribute("id");
		if(sid){
			var found = false;
			var node = styles[i];
			for(var j=0;(j<node.childNodes.length && !found);j++){ 
				var pair = node.childNodes[j];
				for(var k =0;(k<pair.childNodes.length && !found);k++){
					var pn = pair.childNodes[k].nodeName;
					if(pn == "styleUrl"){
						var pid = this.getText(pair.childNodes[k]);
						that.styles["#"+sid] = that.styles[pid];
						found = true;
						}
					if(pn == "Style"){
						that.handleStyle(pair.childNodes[k],sid);
						found = true;
						}
					}
				}
			}
		}

	if(!title){ title = name; }
	if(typeof title == "undefined"){
		title = "KML Document";
		}
        that.title = title;
	if(title.length >that.maxtitlewidth){
		that.maxtitlewidth = title.length;
		}
	var marknames = ["Placemark"];
	var schema = root.getElementsByTagName("Schema");  
	for(var s=0;s<schema.length;s++){
		pname = schema[s].getAttribute("parent");
		if(pname == "Placemark"){
				pname = schema[s].getAttribute("name");
			 	marknames.push(pname);
				}
			}

	bar = Lance$(that.basesidebar);
	if(bar){ bar.style.display=""; }
	idx = that.overlayman.folders.length;
	var paren = that.kml.length-1;
	var fid = that.processKML(root, marknames, title, that.basesidebar,idx, paren);	
	that.kml[paren].folders.push(idx);
	}
     else { 
	placemarks = root.getElementsByTagName("item");
	if(placemarks.length <1){
		placemarks = root.getElementsByTagName("atom");
		}
	if(placemarks.length <1){
		placemarks = root.getElementsByTagName("entry");
		}
	if(!title){ title = name; }
	if(typeof title == "undefined"){
		title = "News Feed";
		}
        that.title = title;
	if(title.length >that.maxtitlewidth){
		that.maxtitlewidth = title.length;
		}
	var style;
	if(that.opts.baseicon){
		style = that.opts.baseicon;
        shadow = that.rssicon.replace(".png",".shadow.png");
        style.shadow = shadow +"_shadow.png";
		}
	else {
        style = new google.maps.MarkerImage(that.rssicon,new google.maps.Size(32,32)); //_DEFAULT_ICONG_DEFAULT_ICON
		style.origin = new google.maps.Point(0,0);
        style.anchor = new google.maps.Point(16,32);
		style.url = that.rssicon;
        shadow = that.rssicon.replace(".png",".shadow.png");
        style.shadow = shadow +"_shadow.png";
		//alert(style.url);
		}
	style.strokeColor = "#00FFFF";
	style.strokeWeight = "3";
	style.strokeOpacity = 0.50;
	if(!desc){ desc = "RSS feed";}
	that.kml[0].folders.push(that.overlayman.folders.length);
    	if(placemarks.length) {
		bar = Lance$(that.basesidebar);
		if(bar){ bar.style.display=""; }
        that.overlayman.folders.push([]);
       	that.overlayman.folderhtml.push([]);
		that.overlayman.folderhtmlast.push(0);
		that.overlayman.folderBounds.push(new google.maps.LatLngBounds());
        	idx = that.overlayman.folders.length-1;	
		that.kml.push(new KMLObj(title,desc,keepopen,idx));
		that.kml[that.kml.length-1].open = keepopen;
		if(that.basesidebar) { 	
		var visible = true;
    		if(that.hideall){ visible = false;}
		var folderid = that.createFolder(idx,title,that.basesidebar,that.globalicon,desc,null,keepopen,visible); }
    		for (i = 0; i < placemarks.length; i++) {
     			that.handlePlacemark(placemarks[i], idx, sbid, style);
    			}
		}
	}

    }
    that.progress--;
    if(that.progress == 0){
	google.maps.event.trigger(that,"initialized");
	if(!that.opts.sidebarid){
		that.mb.showMess("Finished Parsing",1000);
      			// Shall we zoom to the bounds?
		}
 	if (!that.opts.nozoom && !that.basesidebar) {
        	that.map.fitBounds(that.bounds);
      		}
    	}
};


 
GeoXml.prototype.createFolder = function(idx, title, sbid, icon, desc, snippet, keepopen, visible){ 	      
		var sb = Lance$(sbid);
		keepopen = true;	
	 	var folderid = this.myvar+'_folder'+ idx;
                var checked ="";
		if(visible){ checked = " checked "; }
		this.overlayman.folderhtml[folderid]="";
		var disp="display:block";
		var fw= "font-weight:normal";
 		if(typeof keepopen == "undefined" || !keepopen){
			disp ="display:none";
			fw = "font-weight:bold";
	 		}
		if(!desc || desc ==""){
			desc = title;
			}
		desc = escape(desc);
		var htm = '<ul><input type="checkbox" id="'+this.myvar+''+idx+'FCB" style="vertical-align:middle" ';
		htm += checked;
		htm += 'onclick="'+this.myvar+'.toggleContents('+idx+',this.checked)">';
		htm += '&nbsp;<span title="'+snippet+'" id="'+this.myvar+'TB'+idx+'" oncontextmenu=\"'+this.myvar+'.saveJSON('+idx+');\" onclick="'+this.myvar+'.toggleFolder('+idx+')" style=\"'+fw+'\">';
		htm += '<img id=\"'+this.myvar+'FB'+idx+'\" style=\"vertical-align:text-top;padding:0;margin:0\" height=\"'+this.sidebariconheight+'\" border=\"0\" src="'+icon+'" /></span>&nbsp;';
		htm += '<a href="#" onclick="'+this.myvar+'.overlayman.zoomToFolder('+idx+');'+this.myvar+'.mb.showMess(\''+desc+'\',3000);return false;">' + title + '</a><br><div id=\"'+folderid+'\" style="'+disp+'"></div></ul>';
		if(sb){ sb.innerHTML = sb.innerHTML + htm; }
		return folderid;
	    };

GeoXml.prototype.processGML = function(root,title, latlon, desc, me) {
    var that = this;
    var isWFS = false;
    var placemarks = [];
    var srsName;
    var isLatLon = false;
    var xmin = 0;
    var ymin = 0;
    var xscale = 1;
    var yscale = 1;
    var points, pt, pts;
    var coor, coorstr;
    var x, y, k, i;
    var name = title;
    var visible = true;
    if(this.hideall){visible = false; }
    var keepopen = that.allfoldersopen;
    var pt1, pt2, box;
    	for (var ln = 0; ln < root.childNodes.length; ln++) {
		var kid = root.childNodes.item(ln).nodeName;
		var n = root.childNodes.item(ln);
		if(kid == "gml:boundedBy" || kid  == "boundedBy"){
			 for (var j = 0; j < n.childNodes.length; j++) {
				var nn = n.childNodes.item(j).nodeName;
				var llre = /CRS:84|(4326|4269)$/i;
				if(nn == "Box" || nn == "gml:Box"){
					box =  n.childNodes.item(j);
					srsName = n.childNodes.item(j).getAttribute("srsName");
					if(srsName.match(llre)){
						isLatLon = true;
						} 
					else {
						alert("SRSname ="+srsName+"; attempting to create transform");
						 for (k = 0; k < box.childNodes.length; k++) {
							coor = box.childNodes.item(k);
							if(coor.nodeName =="gml:coordinates" ||coor.nodeName =="coordinates" ){
								coorstr =  this.getText(coor);
								pts = coorstr.split(" ");
								pt1 = pts[0].split(",");
								pt2 = pts[1].split(",");
								xscale = (parseFloat(pt2[0]) - parseFloat(pt1[0]))/(latlon.xmax - latlon.xmin);
								yscale = (parseFloat(pt2[1]) - parseFloat(pt1[1]))/(latlon.ymax - latlon.ymin);
								xmin = pt1[0]/xscale - latlon.xmin;
								ymin = pt1[1]/yscale - latlon.ymin;
								}
							}
						}
					break;
					}
				if(nn == "Envelope" || nn == "gml:Envelope"){
					box =  n.childNodes.item(j);
					srsName = n.childNodes.item(j).getAttribute("srsName");
					if(srsName.match(llre)){
						isLatLon = true;
						} 
					else {
						alert("SRSname ="+srsName+"; attempting to create transform");
						 for (k = 0; k < box.childNodes.length; k++) {
							coor = box.childNodes.item(k);
							if(coor.nodeName =="gml:coordinates" ||coor.nodeName =="coordinates" ) {
								pts = coor.split(" ");
								var b = {"xmin":100000000,"ymin":100000000,"xmax":-100000000,"ymax":-100000000};
								for(var m = 0;m<pts.length-1;m++){
									pt = pts[m].split(",");
									x = parseFloat(pt[0]);
									y = parseFloat(pt[1]);
									if(x<b.xmin){ b.xmin = x; }
									if(y<b.ymin){ b.ymin = y; }
									if(x>b.xmax){ b.xmax = x; }
									if(y>b.ymax){ b.ymax = y; }
									}
								xscale = (b.xmax - b.xmin)/(latlon.xmax - latlon.xmin);
								yscale = (b.ymax - b.ymin)/(latlon.ymax - latlon.ymin);
								xmin = b.xmin/xscale - latlon.xmin;
								ymin = b.ymin/yscale - latlon.ymin;
								}
							}
						}
					
						}
						break;
					}
				}
		if(kid == "gml:featureMember" || kid == "featureMember"){
			placemarks.push(n);
			}
		}
 
     var folderid;
     if(!title){ title = name; }
       this.title = title;
       if(placemarks.length<1){
		alert("No features found in "+title);
		this.mb.showMess("No features found in "+title,3000);
		} 
	else {
	    this.mb.showMess("Adding "+placemarks.length+" features found in "+title);
            this.overlayman.folders.push([]);
            this.overlayman.folderhtml.push([]);
	    this.overlayman.folderhtmlast.push(0);
	    this.overlayman.folderBounds.push(new google.maps.LatLngBounds());
	    var idx = this.overlayman.folders.length-1;
	    if(this.basesidebar) {
	//	alert("before createFolder "+visible);
		folderid = this.createFolder(idx,title,this.basesidebar,this.gmlicon,desc,null,keepopen,visible);
	    	}
 	    this.kml.push(new KMLObj(title,desc,true,idx));
	    this.kml[me].open = that.opts.allfoldersopen; 
	    this.kml[me].folderid = folderid;


	if(isLatLon){
    		for (i = 0; i < placemarks.length; i++) {
     			this.handlePlacemark(placemarks[i],idx,0);
    			}
		}
	else {
	     var trans = {"xs":xscale,"ys":yscale,"x":xmin, "y":ymin };
	    for (i = 0; i < placemarks.length; i++) {
		        this.handleGeomark(placemarks[i],idx,trans,0);
		        }
	    	}
	}
    // Is this the last file to be processed?
};

google.maps.Polyline.prototype.getBounds = function() {
  if(typeof this.bounds!="undefined") { return this.bounds; }
   else { return (this.computeBounds()); }
  };

google.maps.Polyline.prototype.getPosition = function () { 
	var p = this.getPath();
	return (p.getAt(Math.round(p.getLength()/2))); 
	};
google.maps.Polyline.prototype.computeBounds = function() {
  var bounds = new google.maps.LatLngBounds();
  var p = this.getPath();
  for (var i=0; i < p.getLength() ; i++) {
	var v = p.getAt(i);
	if(v){ 
		bounds.extend(v); 
		}
  	}

  this.bounds = bounds;
  return bounds;
};
/*
GTileLayerOverlay.prototype.getBounds = function(){return this.bounds; };

GTileLayer.prototype.getBounds = function(){
	return this.bounds;
	}; 
*/
google.maps.Polygon.prototype.getPosition = function() { return (this.getBounds().getCenter()); };
google.maps.Polygon.prototype.computeBounds = function() {
  var bounds = new google.maps.LatLngBounds();
  var p = this.getPaths();
  for(var a=0;a < p.getLength();a++) { 
	var s = p.getAt(a);
	for (var i=0; i < s.getLength() ; i++) {
		var v = s.getAt(i);
		if(v){ 
			bounds.extend(v); 
			}
		}
	}
  this.bounds = bounds;
  return bounds;
};
google.maps.Polygon.prototype.getBounds = function() {
  if(typeof this.bounds!="undefined") { return this.bounds; }
   else { return (this.computeBounds()); }
  };
google.maps.Polygon.prototype.getCenter = function() {
	return (this.getBounds().getCenter()); 
  };
OverlayManager = function ( map , paren ) {
    this.myvar = paren.myvar;
    this.paren = paren;
    this.map = map;
    this.markers = [];
    this.byid = [];
    this.byname = [];
    this.groups = [];
    this.timeout = null;
    this.folders = [];
    this.folderBounds = [];
    this.folderhtml = [];
    this.folderhtmlast = [];
    this.subfolders = [];
    this.currentZoomLevel = map.getZoom();
    this.isParsed = false;

    this.maxVisibleMarkers = OverlayManager.defaultMaxVisibleMarkers;
    this.gridSize = OverlayManager.defaultGridSize;
    this.minMarkersPerCluster = OverlayManager.defaultMinMarkersPerCluster;
    this.maxLinesPerInfoBox = OverlayManager.defaultMaxLinesPerInfoBox;
    this.icon = OverlayManager.defaultIcon;
	google.maps.event.addListener( this.paren, 'adjusted',OverlayManager.MakeCaller( OverlayManager.Display, this ) );
	google.maps.event.addListener( map, 'idle', OverlayManager.MakeCaller( OverlayManager.Display, this ) );
    //google.maps.event.addListener( map, 'zoomend', OverlayManager.MakeCaller( OverlayManager.Display, this ) );
   // google.maps.event.addListener( map, 'moveend', OverlayManager.MakeCaller( OverlayManager.Display, this ) );
    google.maps.event.addListener( map, 'infowindowclose', OverlayManager.MakeCaller( OverlayManager.PopDown, this ) );
	this.icon.pane = this.paren.markerpane;
    };

OverlayManager.defaultMaxVisibleMarkers =  6000;
OverlayManager.defaultGridSize = 20;
OverlayManager.defaultMinMarkersPerCluster = 10;
OverlayManager.defaultMaxLinesPerInfoBox = 15;
OverlayManager.defaultIcon = new google.maps.MarkerImage('http://maps.google.com/mapfiles/kml/paddle/blu-circle.png',
			new google.maps.Size(32, 32), //size
			new google.maps.Point(0, 0), //origin
			new google.maps.Point(16, 12), //anchor
			new google.maps.Size(32, 32) //scaledSize 
			);

// Call this to change the group icon.
OverlayManager.prototype.SetIcon = function ( icon ) {
    this.icon = icon;
    };


// Changes the maximum number of visible markers before clustering kicks in.
OverlayManager.prototype.SetMaxVisibleMarkers = function ( n ){
    this.maxVisibleMarkers = n;
    };


// Sets the minumum number of markers for a group.
OverlayManager.prototype.SetMinMarkersPerCluster = function ( n ){
    this.minMarkersPerCluster = n;
    };


// Sets the maximum number of lines in an info box.
OverlayManager.prototype.SetMaxLinesPerInfoBox = function ( n ){
    this.maxLinesPerInfoBox = n;
    };


// Call this to add a marker.
OverlayManager.prototype.AddMarker = function (marker, title, idx, sidebar, visible, forcevisible) { 
    if (marker.setMap != null){
		marker.setMap(this.map);
		}
    marker.hidden = false;
    if(visible != true){marker.hidden = true; }
    if(this.paren.hideall){marker.hidden = true; }
    marker.title = title;
    this.folders[idx].push(this.markers.length);
    var bounds = this.map.getBounds();
	var vis = false;
	if(bounds) { //map doesnt have bounds defined?
		if(typeof marker.getBounds =="undefined"){
			if (bounds.contains(marker.getPosition())) { 
				vis = true;  
				}
			}
		else {
			var b = marker.getBounds();
			if(!b.isEmpty()){
				if(bounds.intersects(b)){ 
					vis = true;  
					}
				}
			}
		}
	else {
		vis = true;
		}
     if(forcevisible){ vis = true; }
   // var id = this.markers.length;
    this.markers.push(marker);

    if(vis){ 
		if(marker.hidden){
			marker.setMap(null); 
			marker.onMap = false;
			if(!!marker.label){ marker.label.hide();} 
			}
		else {
			marker.setMap(this.map);
			marker.onMap = true;
			}
		}
    this.DisplayLater();
    if(sidebar){
	this.folderhtml[idx].push(sidebar);
	}
   // return id;
    };

OverlayManager.prototype.zoomToFolder = function (idx) {
	var bounds = this.folderBounds[idx];
	this.map.fitBounds(bounds);
	};


// Call this to remove a marker.
OverlayManager.prototype.RemoveMarker = function ( marker ) {
    for ( var i = 0; i < this.markers.length; ++i ) {
	if ( this.markers[i] == marker ) {
	    if (marker.onMap){
			marker.setMap(null);
			}
	    if(!!marker.label){
			marker.label.setMap(null);
			} 
	    for ( var j = 0; j < this.groups.length; ++j ) {
		var group = this.groups[j];
		if ( group!= null )
		    {
		    for ( var k = 0; k < group.markers.length; ++k ){
			if ( group.markers[k] == marker ) {
			    group.markers[k] = null;
			    --group.markerCount;
			    break;
			    }
		    	}
		    if ( group.markerCount == 0 ) {
			this.ClearGroup( group );
			this.groups[j] = null;
			}
		    else { 
			if ( group == this.poppedUpCluster ){ OverlayManager.RePop( this );}
		    	}
		    }
		}
	    this.markers[i] = null;
	    break;
	    } 
	}
    this.DisplayLater();
    };



OverlayManager.prototype.DisplayLater = function (){
    if ( this.timeout!= null ){ 
	clearTimeout( this.timeout ); }
    this.timeout = setTimeout( OverlayManager.MakeCaller( OverlayManager.Display, this ), 50);
    };


OverlayManager.Display = function (overlaymanager){
    var i, j, k, marker, group, l;
    clearTimeout( overlaymanager.timeout );
    if(overlaymanager.paren.allRemoved){
		return;
		}

    var update_side = false;
    var count = 0;
    var clon, bits;
    var vis;
    var content;
    if(overlaymanager.paren.basesidebar){
    for(k = 0; k< overlaymanager.folderhtml.length ; k++ ){	
	var curlen = overlaymanager.folderhtml[k].length;
	var con = overlaymanager.folderhtmlast[k];
	if(con < curlen){
		var destid = overlaymanager.paren.myvar+"_folder"+k;
		var dest = Lance$(destid);
		if(dest){
			if(overlaymanager.paren.opts.sortbyname){
			        content = dest.innerHTML;
				clon = overlaymanager.folderhtml[k].sort();
				for(l=0; l<curlen; l++){
 					bits = clon[l].split("$$$",8);
          				content += overlaymanager.paren.sidebarfn(bits[0],bits[1],bits[2],bits[3],bits[4],bits[5],bits[6],bits[7]); 
					}
				}
			else {
	 		       content = dest.innerHTML;
			       clon = overlaymanager.folderhtml[k];
				for(l=con; l<curlen; l++){
 					bits = clon[l].split("$$$",8);
          				content += overlaymanager.paren.sidebarfn(bits[0],bits[1],bits[2],bits[3],bits[4],bits[5],bits[6],bits[7]);  
					}
				}
				
			overlaymanager.folderhtmlast[k] = curlen;
			dest.innerHTML  = content;
		 	if(overlaymanager.paren.forcefoldersopen){
	 			dest.style.display = "block";
	 			}
			update_side = true;
			count = curlen;
			}
		else {
		//	alert("target folder not found "+destid);
			}
		}
		}
	}
	
  // Is this the last file to be processed?
  	
	if(update_side && count>0){
		 if (overlaymanager.paren.progress == 0) {
			overlaymanager.paren.setFolders();
     			google.maps.event.trigger(overlaymanager.paren,"parsed");
      			if(!overlaymanager.paren.opts.sidebarid){	
				overlaymanager.paren.mb.showMess("Finished Parsing",1000);
				}
			var mifinish = new Date();
			var sec = ((mifinish - overlaymanager.miStart)/1000+" seconds");
			overlaymanager.paren.mb.showMess("Loaded "+count+"  GeoXML elements in "+sec,5000);
			overlaymanager.paren.ParseURL();
			if (!overlaymanager.paren.opts.nozoom) {
					overlaymanager.paren.map.fitBounds(overlaymanager.paren.bounds);
      				}
    			}
		}

    if (update_side && typeof resizeKML != "undefined"){
		resizeKML();
		} 

    var bounds;
	var sw;
	var ne;
	var dx;
	var dy;
    var newZoomLevel = overlaymanager.map.getZoom();
    if ( newZoomLevel != overlaymanager.currentZoomLevel ) {
	// When the zoom level changes, we have to remove all the groups.
	for ( i = 0; i < overlaymanager.groups.length; ++i ){
	    if ( overlaymanager.groups[i]!= null ) {
		overlaymanager.ClearGroup( overlaymanager.groups[i] );
		overlaymanager.groups[i] = null;
		}
	}
	overlaymanager.groups.length = 0;
	overlaymanager.currentZoomLevel = newZoomLevel;
	}

    // Get the current bounds of the visible area.
   // bounds = overlaymanager.map.getBounds();
	if(overlaymanager.map.getBounds()) {
		// Expand the bounds a little, so things look smoother when scrolling
		// by small amounts.
		  bounds = overlaymanager.map.getBounds();
		  //alert(bounds);
		  sw = bounds.getSouthWest();
		  ne = bounds.getNorthEast();
		  dx = ne.lng() - sw.lng();
		  dy = ne.lat() - sw.lat();
		if ( dx < 300 && dy < 150 ){
			dx *= 0.05;
			dy *= 0.05;
			bounds = new google.maps.LatLngBounds(
			new google.maps.LatLng( sw.lat() - dy, sw.lng() - dx ),
			new google.maps.LatLng( ne.lat() + dy, ne.lng() + dx ) );
			}
		
		}
	if(!!!bounds && overlaymanager.map){
		//alert("finding bounds");
		bounds = overlaymanager.map.getBounds();
		if(!!!bounds)return;
		}
    // Partition the markers into visible and non-visible lists.
    var visibleMarkers = [];
    var nonvisibleMarkers = [];
    var viscount = 0;
 
    for ( i = 0; i < overlaymanager.markers.length; ++i ) {
		marker = overlaymanager.markers[i];
		vis = false;
		//alert(marker);
		if (marker!== null ){
			var mid = overlaymanager.paren.myvar+"sb"+i;	
				if(typeof marker.getBounds == "undefined"){
					var pos = marker.getPosition();
					if (bounds.contains(pos) ) {
						vis = true; 
						viscount++;
						}
					}
				else {
					var b = marker.getBounds();
					if(bounds.intersects(b)){
							vis = true;
							}
					}
				if(Lance$(mid)){ 
						if(vis){ Lance$(mid).className = "inView"; }
						 else { Lance$(mid).className = "outView"; }
						}
				//alert(vis);
				if(vis && (marker.hidden == false)){ 
						visibleMarkers.push(i); 
						}
				else { nonvisibleMarkers.push(i); }
			  
			}
		}

    // Take down the non-visible markers.
	//	alert("nonvisible = "+nonvisibleMarkers.length);
    for ( i = 0; i < nonvisibleMarkers.length; ++i ) {
		marker = overlaymanager.markers[nonvisibleMarkers[i]];
		if (marker.onMap){
			if(!!marker.label){ 
				marker.label.setMap(null);
				}
		marker.setMap(null); 
	    marker.onMap = false;
	    }
	}

    // Take down the non-visible groups.
    for ( i = 0; i < overlaymanager.groups.length; ++i ) {
	group = overlaymanager.groups[i];
	if(group!= null && group.marker) {
		 vis = false;
			if(typeof group.marker.getBounds =="undefined"){
				if (bounds.contains(group.marker.getPosition()) ) { vis = true; }
				}
	     	  	else {
				vis = true;
		 		}
		if (!vis && group.onMap) {
				group.marker.setMap(null);
				group.onMap = false;
	    		}
		}
	}
 

    if (viscount > overlaymanager.maxVisibleMarkers) {
	// Add to the list of groups by splitting up the current bounds
	// into a grid.
	if(!update_side){
		overlaymanager.paren.mb.showMess("Clustering on "+viscount+"  GeoXML elements");
		}

	var latRange = bounds.getNorthEast().lat() - bounds.getSouthWest().lat();
	var latInc = latRange / overlaymanager.gridSize;
	var lngInc = latInc / Math.cos( ( bounds.getNorthEast().lat() + bounds.getSouthWest().lat() ) / 2.0 * Math.PI / 180.0 );
	for ( var lat = bounds.getSouthWest().lat(); lat <= bounds.getNorthEast().lat(); lat += latInc ) {
	    for ( var lng = bounds.getSouthWest().lng(); lng <= bounds.getNorthEast().lng(); lng += lngInc ) {
			group = {};
			group.overlaymanager = overlaymanager;
			group.bounds = new google.maps.LatLngBounds( new google.maps.LatLng( lat, lng ), new google.maps.LatLng( lat + latInc, lng + lngInc ) );
			group.markers = [];
			group.markerCount = 0;
			group.onMap = false;
			group.marker = null;
			overlaymanager.groups.push(group);
			}
		}

	// Put all the unclustered visible markers into a group - the first
	// one it fits in, which favors pre-existing groups.
	for ( i = 0; i < visibleMarkers.length; ++i ) {
	    marker = overlaymanager.markers[visibleMarkers[i]];
	    if (marker!= null && !marker.inCluster ) {
		for ( j = 0; j < overlaymanager.groups.length; ++j ) {
		    group = overlaymanager.groups[j];
		    if(group!= null){
		        vis = false;
		        if(typeof marker.getBounds =="undefined"){ 
				    if (group.bounds.contains(marker.getPosition())) { vis = true;   }
				    }
		        if (vis){
					marker.inCluster = true;
			        overlaymanager.groups[j].markers.push(marker);
			        ++overlaymanager.groups[j].markerCount;
			        }
			    }
		    }   
		}
	    }

	// Get rid of any groups containing only a few markers.
	for ( i = 0; i < overlaymanager.groups.length; ++i ) {
	    if ( overlaymanager.groups[i]!= null && overlaymanager.groups[i].markerCount < overlaymanager.minMarkersPerCluster )
		{
		overlaymanager.ClearGroup( overlaymanager.groups[i] );
		overlaymanager.groups[i] = null;
		}
	     }

	// Shrink the groups list.
	for ( i = overlaymanager.groups.length - 1; i >= 0; --i ){
	    if ( overlaymanager.groups[i]!= null ){
		break; }
	    else {
		--overlaymanager.groups.length;
	    	}
		}
  
	// Ok, we have our groups.  Go through the markers in each
	// group and remove them from the map if they are currently up.
	for ( i = 0; i < overlaymanager.groups.length; ++i )
	    {
	    group = overlaymanager.groups[i];
	    if ( group!= null )
		{
		for ( j = 0; j < group.markers.length; ++j )
		    {
		    marker = group.markers[j];
		    if ( marker!= null && marker.onMap )
			{
			marker.setMap(null);
			marker.onMap = false;
			if(!!marker.label){
				marker.label.hide();
			//	overlaymanager.map.removeOverlay(marker.label);
				}
			}
		    }
		}
	    }

	// Now make group-markers for any groups that need one.
	for ( i = 0; i < overlaymanager.groups.length; ++i )
	    {
	    group = overlaymanager.groups[i];
	    if ( group!= null && group.marker == null )
		{
		// Figure out the average coordinates of the markers in this
		// group.
		var xTotal = 0.0;
		var yTotal = 0.0;
		for ( j = 0; j < group.markers.length; ++j ) {
		    marker = group.markers[j];
		    if ( marker!= null ){
				xTotal += ( + marker.getPosition().lng() );
				yTotal += ( + marker.getPosition().lat() );
				}
		    }
		var location = new google.maps.LatLng( yTotal / group.markerCount, xTotal / group.markerCount );
	//	alert(overlaymanager.icon.image_ + " "+ overlaymanager.icon.image);
		marker = new google.maps.Marker( {position:location, icon:OverlayManager.defaultIcon, title:"Cluster" }) ;//new LMarker( location, overlaymanager.icon );
		
		group.marker = marker;
		google.maps.event.addListener( marker, 'click', OverlayManager.MakeCaller( OverlayManager.PopUp, group ) );
		}
	    }

	}

    if(!update_side && viscount && (overlaymanager.paren.quiet != true)){
		overlaymanager.paren.mb.showMess("Showing "+viscount+"  GeoXML elements",500);
		}

    // Display the visible markers not already up and not in groups.
    for ( i = 0; i < visibleMarkers.length; ++i ) {
	marker = overlaymanager.markers[visibleMarkers[i]];
	if ( marker!= null && !marker.onMap && !marker.inCluster) {
	    if (marker.addedToMap!= null ) { 
				marker.addedToMap(); 
				}
	    if(marker.hidden){
			marker.setMap(null);
			if(!!marker.label){ 
				marker.label.setMap(null);
	       		} 
			}
		else {
			marker.onMap = true;
			marker.setMap(overlaymanager.map);
			}
	    }
	}

    // Display the visible groups not already up.
    for ( i = 0; i < overlaymanager.groups.length; ++i ) {
	group = overlaymanager.groups[i]; 
	if(group!= null && group.marker) {
	    vis = false;
	    if(typeof marker.getPosition !="undefined"){
		    if (bounds.contains( group.marker.getPosition())){ vis = true; }
	   		 }
	        else {
			if(bounds.intersects(group.marker.getBounds())) { vis=true;}
			}
	    if (!group.onMap && vis ) {
		    group.marker.setMap(overlaymanager.map);
	        group.onMap = true;
	        }
	    }
	}

 
    OverlayManager.RePop( overlaymanager );
    };


OverlayManager.PopUp = function ( group )
    {
    var overlaymanager = group.overlaymanager;
    var html = '<table style="font-size:10px" width="300">';
    var n = 0;
    for ( var i = 0; i < group.markers.length; ++i )
	{
	var marker = group.markers[i];
	if ( marker!= null )
	    {
	    ++n;
	    html += '<tr><td>';
	    if (marker.smallImage != null ){ 
		html += '<img src="' + marker.smallImage + '">'; }
	    else {
		html += '<img src="' + marker.image_ + '" width="' + ( marker.width_ / 2 ) + '" height="' + ( marker.height_ / 2 ) + '">'; }
	    html += '</td><td>' + marker.title + '</td></tr>';
	    if ( n == overlaymanager.maxLinesPerInfoBox - 1 && group.markerCount > overlaymanager.maxLinesPerInfoBox  )
		{
		html += '<tr><td colspan="2">...and ' + ( group.markerCount - n ) + ' more</td></tr>';
		break;
		}
	    }
	}
    html += '</table>';
   // overlaymanager.map.closeInfoWindow(); close Last Marker
	this.paren.lastMarker.infoWindow.close();
	var infoWindowOptions = { 
				content: html,
				pixelOffset: new google.maps.Size(0, 2),
				position:overlaymanager.marker.getPosition()
				};
	if(this.paren.maxiwwidth){
					infoWindowOptions.maxWidth = this.paren.maxiwwidth;
					}
	overlaymanager.marker.infoWindow = new google.maps.InfoWindow(infoWindowOptions);
	this.paren.lastMarker = overlaymanager.marker;
	this.paren.lastMarker.infoWindow.open(this.paren.map);
    overlaymanager.poppedUpCluster = group;
    };


OverlayManager.RePop = function ( overlaymanager )
    {
    if ( overlaymanager.poppedUpCluster!= null ){ 
	OverlayManager.PopUp( overlaymanager.poppedUpCluster ); }
    };


OverlayManager.PopDown = function ( overlaymanager )
    {
    overlaymanager.poppedUpCluster = null;
    };


OverlayManager.prototype.ClearGroup = function ( group )
    {
    var i, marker;

    for ( i = 0; i < group.markers.length; ++i ) {
	if ( group.markers[i]!= null ) {
	    group.markers[i].inCluster = false;
	    group.markers[i] = null;
	    }
    	}
    group.markers.length = 0;
    group.markerCount = 0;
    if ( group == this.poppedUpCluster ) {
	this.map.closeInfoWindow(); }
    if (group.onMap) {
		group.marker.setMap(null); 
		group.onMap = false;
		}
    };


// This returns a function closure that calls the given routine with the
// specified arg.
OverlayManager.MakeCaller = function ( func, arg )
    {
    return function () { func( arg ); };
    };

MessageBox = function(map,paren,myvar,mb){
	this.map = map;
	this.paren = paren;
	this.myvar = paren.myvar+"."+myvar;
	this.eraseMess = null;
	this.centerMe = null;
	this.mb = null;
	if(mb){ this.mb = mb; }
	this.id = this.myvar + "_message";
	};

MessageBox.prototype.hideMess = function(){
	if(this.paren.quiet){
		return;
		}
  	this.mb.style.visiblity ="hidden"; 
	this.mb.style.left = "-1200px";
	this.mb.style.top = "-1200px";
	};

MessageBox.prototype.centerThis = function(){
	var c ={};
	c.x = this.map.getDiv().offsetWidth/2;
	c.y = this.map.getDiv().offsetHeight/2;
	//alert(c.x);
	if(!this.mb){ 
		this.mb = Lance$(this.id); 
		}
	if(this.centerMe){ clearTimeout(this.centerMe);}
	if(this.mb){
		var nw = this.mb.offsetWidth;
		if(nw > this.map.getDiv().offsetWidth){
			nw = parseInt(2*c.x/3,10);
			this.mb.style.width = nw +"px";
			this.centerMe = setTimeout(this.myvar+".centerThis()",5);
			return; 
			}
		this.mb.style.left = (c.x - (nw/2)) +"px";
		this.mb.style.top = (c.y - 20 - (this.mb.offsetHeight/2))+ "px";
		}
	else {
		this.centerMe = setTimeout(this.myvar+".centerThis()",10);
		}
	};

MessageBox.prototype.showMess = function (val,temp){
	if(this.paren.quiet){
		if(console){
			console.log(val);
			}
		return;
		}
	val = unescape(val);
	if(this.eraseMess){ clearTimeout(this.eraseMess); }
	if(!this.mb){ this.mb = Lance$(this.id); }
	if(this.mb){

		this.mb.innerHTML = "<span>"+val+"</span>";

	    if(temp){
				this.eraseMess = setTimeout(this.myvar+".hideMess();",temp);
				}
		var d = this.map.getDiv();
		var w = this.mb.offsetWidth/2;
		var h = this.mb.ofsetHeigtht/2;
		this.mb.style.left = parseInt(d.offsetWidth/2 - w) + "px";
		this.mb.style.top = parseInt(d.offsetHeight/2 - h) + "px";
		this.mb.style.width = "";
		this.mb.style.height = "";
		this.centerMe = setTimeout(this.myvar+".centerThis()",5);
		this.mb.style.visibility = "visible"; 
		}

	else {  
		var d = document.createElement("div");
		d.innerHTML = val;
		d.id = this.myvar + "_message";
		d.style.position = "absolute";
		d.style.backgroundColor = this.style.backgroundColor || "silver";
		d.style.opacity = this.style.opacity || 0.80;
		if(document.all) {
			d.style.filter = "alpha(opacity="+parseInt(d.style.opacity*100,10)+")";
			}
		d.style.color = this.style.color || "black";
		d.style.padding = this.style.padding || "6px";
 		d.style.borderWidth = this.style.borderWidth || "3px";
		d.style.borderColor = this.style.borderColor || "";
		d.style.backgroundImage = this.style.backgroundImage || "";
		d.style.borderStyle = this.style.borderStyle || "outset";
		d.style.visibility = "visible";
		d.style.left = "-1200px";
		d.style.top = "-1200px";
		//alert(this.myvar);
	 	this.centerMe = setTimeout(this.myvar+".centerThis()",5);
	
		d.style.zIndex = 1000;
		document.body.appendChild(d);
		}
	}; 

GeoXml.prototype.loadJSONUrl = function (url, title, latlon, desc, idx) {
  var that = this;
  GDownloadUrl(url, function(doc) {
    	that.parseJSON(doc,title, latlon, desc, idx);
  	});
};

GeoXml.prototype.loadXMLUrl = function(url, title, latlon, desc, idx) {
    var that = this;
    that.DownloadURL(url, function(doc) {
        var xmlDoc = that.parseXML(doc);
        that.processing(xmlDoc, title, latlon, desc, idx);
    }, title);
};

GeoXml.prototype.upgradeLayer = function(n) {
	var mt = this.map.getMapTypes();
	var found = false;
	for(var i=0;i<mt.length;i++){
		if(mt[i] == this.baseLayers[n]){
			found = true;
			this.map.removeMapType(this.baseLayers[n]);
			}
		}
	if(!found){ this.map.addMapType(this.baseLayers[n]); }
	};

GeoXml.prototype.makeWMSTileLayer = function(getmapstring, on, title, opac, attr, grouptitle, wmsbounds) { //not yet working.
	var that = this;
	gmapstring = new String(getmapstring);
	getmapstring = gmapstring.replace("&amp;","&");
 	var args = getmapstring.split("?");
	var baseurl = args[0]+"?";
	baseurl = baseurl.replace(/&request=getmap/i,"");
	baseurl = baseurl.replace(/&service=wms/i,"");
	//alert("base"+baseurl);
	var version = "1.1.0";
	var format = "image/png";
	var styles = "";
	var layers = "";
	var queryable = false;
	var opacity = 1.0;
	if(typeof opac!="undefined"){ opacity = opac; }
	var bbox = "-180,-90,180,90";
	var pairs = args[1].split("&");
	var sld ="";
	var servicename="";
	var atlasname="";
	var gmcrs = "";
	var epsg;
	for(var i=0;i < pairs.length; i++){
		var dstr = pairs[i];
		var duo = pairs[i].split("=");
		var dl = duo[0].toLowerCase();
		switch(dl) {
			case "version" : version = duo[1];break;
			case "bbox": bbox = duo[1]; break;
			case "width":
			case "height":break;
			case "service":break;
			case "servicename": servicename = duo[1]; break;
			case "atlasname":atlasname = duo[1];break;
			case "styles": styles = duo[1]; break;
			case "layers": layers = duo[1]; break;
			case "format": format = duo[1]; break;
			case "opacity":opacity = parseFloat(duo[1]); break;
			case "crs":
			case "srs":epsg = duo[1]; break;
			case "gmcrs":gmcrs = duo[1];break;
			case "queryable":queryable = duo[1];break;
			case "getmap":break;
			case "service":break;
			default : if(duo[0]){ baseurl += "&"+pairs[i]; } break;
			}
		}

	if(gmcrs) { 
		epsg = gmcrs; 
		}
	var bbn = bbox.split(",");
	var bb = {"w":parseFloat(bbn[0]),"s":parseFloat(bbn[1]),"e":parseFloat(bbn[2]),"n":parseFloat(bbn[3])};
	var lon = (bb.n - bb.s);
	var z = 0; 
	var ex = 180;

 	while(ex >= lon){
		ex = ex/2;
		z++;
		}
	z--;
	if(z<1){ z=1; }

 	if(!attr) { attr = "Base Map from OGC WMS"; }
	//var cr0 = new GCopyright(1, new google.maps.LatLngBounds(new google.maps.LatLng(bb.s,bb.w),new google.maps.LatLng(bb.n,bb.e)),0,attr);
   // 	var cc0 = new GCopyrightCollection("");
   //  	cc0.addCopyright(cr0);
   /*
 	var twms = new IMGTileSet({baseUrl:baseurl}); //GTileLayer(cc0,z,19);
	twms.s = bb.s; twms.n = bb.n; twms.e = bb.e; twms.w = bb.w;
	twms.myBaseURL = baseurl;
	if(servicename){
		twms.servicename = servicename;
		}
	if(atlasname){
		twms.atlasname = atlasname;
		}
	twms.publishdirectory = this.publishdirectory;
	twms.epsg = epsg;
	twms.getPath = function(cords,c) {
		a,b
		if (typeof(this.myStyles)=="undefined") {
			this.myStyles=""; 
			}
		var lULP = new google.maps.Point(a.x*256,(a.y+1)*256);
		var lLRP = new google.maps.Point((a.x+1)*256,a.y*256);
		var lUL = G_NORMAL_MAP.getProjection().fromPixelToLatLng(lULP,b,c);
		var lLR = G_NORMAL_MAP.getProjection().fromPixelToLatLng(lLRP,b,c);
		var west = lUL.x;
		var east = lLR.x;
		var north = lUL.y;
		var south = lLR.y;
		var ge = east;
		var gw = west;
		var gs = south;
		var gn = north;
		if(gn < gs){ gs = gn; gn = south; }
		if(this.epsg != "EPSG:4326" && this.epsg != "CRS:84" && this.epsg!= "4326") {
			west = GeoXml.merc2Lon(west);
			north = GeoXml.merc2Lat(north);
			east = GeoXml.merc2Lon(east);
			south = GeoXml.merc2Lat(south);
			}
		var w = Math.abs(east - west);
		var h = Math.abs(north - south);
		var s = h/w;
 		h = Math.round((256.0 * s) + 0.5);
 
		w = 256;
		var sud = south; 
		if(north < south){
			south = north; north = sud; 
			}

		  if(gs>(this.n) || ge < (this.w) || gn < (this.s) || gw > (this.e)  ){
			var retstr = this.publishdirectory +"black.gif";
		 	}

    		var lBbox=west+","+south+","+east+","+north;
		var lSRS="EPSG:41001";
		if(typeof this.epsg != "undefined" || this.srs == "4326"){
    			lSRS=this.epsg;
			}


		var lURL=this.myBaseURL;	
		if(typeof this.myVersion == "undefined"){ this.myVersion = "1.1.1"; }

		var ver = parseFloat(this.myVersion);
		var arcims = /arcimsproxy/i; 
		if(!this.myBaseURL.match(arcims)) {
			lURL+="&SERVICE=WMS";
			if(this.myVersion !="1.0.0"){
				var gmap = /request=getmap/i;
				if(!lURL.match(gmap)){
					lURL+="&REQUEST=GetMap";
					}
				}
			else {
				lURL+="&REQUEST=Map";
				}
			}
		if(this.servicename){
			lURL += "?ServiceName="+this.servicename;
			}
		if(this.atlasname){
			lURL += "&AtlasName="+this.servicename;
			}
		lURL+="&VERSION="+this.myVersion;
		if(this.myLayers) {
			lURL+="&LAYERS="+this.myLayers;
			lURL+="&STYLES="+this.myStyles; 
			}
		if(this.mySLD){
			lURL+="&SLD="+this.mySLD; 
			}
  		lURL+="&FORMAT="+this.myFormat;
		lURL+="&BGCOLOR=0x000000";
		lURL+="&TRANSPARENT=TRUE";
		if(this.myVersion == "1.1.1" || ver<1.3 ){
			lURL += "&SRS=" + lSRS;
			}

		else {
			lURL += "&CRS=" + lSRS;

			}
		lURL+="&WIDTH="+w;
		lURL+="&HEIGHT="+h;
		lURL+="&BBOX="+lBbox;
		this.requestCount++;
		return lURL;
		};
	twms.myFormat = format;
	twms.myVersion = version;
	twms.myExtents = bbox;
	twms.queryable = queryable;
	twms.opacity = opacity;
	twms.getOpacity = function() { return this.opacity; };
	if(sld){
		twms.mySLD = sld;
		}
	else {
		twms.myLayers = layers;
		twms.myStyles = styles;
		}

	var ol = new IMGTileSet(twms);
	
	ol.myBounds = new google.maps.LatLngBounds();
	ol.myBounds.extend(new google.maps.LatLng(bb.n,bb.e));
	ol.myBounds.extend(new google.maps.LatLng(bb.s,bb.w));

	this.wmscount++;
 	if(this.opts.doMapTypes){
		 
 		var twms2 = new GTileLayer(cc0,z,19);
		twms2.s = bb.s; 
		twms2.n = bb.n;
		twms2.e = bb.e;
		twms2.w = bb.w;
		twms2.myBaseURL = baseurl;
		twms2.servicename = servicename;
		twms2.publishdirectory = this.publishdirectory;
		twms2.getTileUrl = twms.getTileUrl;
		twms2.myFormat =  twms.myFormat;
		twms2.myVersion = version;
		twms2.opacity = 1.0;
		twms2.title = title;
		if(attr) {
			twms2.attribution = attr;
			}
		twms2.getOpacity = function() { return this.opacity; };
		if(sld){
			twms2.mySLD = sld;
			}
		else {
			twms2.myLayers = layers;
			twms2.myStyles = styles;
			}
		twms2.epsg = epsg;
		var base = new GTileLayer(cc0,z,19);
		base.s = bb.s; 
		base.n = bb.n;
		base.e = bb.e;
		base.w = bb.w;  
		base.dir = this.publishdirectory;
		base.getTileUrl = function () {
			return (this.dir +"black.gif");
			};
		base.opacity = 1.0;
		base.title = title;
		if(attr) {
			base.attribution = attr;
			}
		base.getOpacity = function() { return this.opacity; };
		//base,
		var layer = [twms2, G_HYBRID_MAP.getTileLayers()[1]];
		var cmap = new GMapType(layer, G_HYBRID_MAP.getProjection(), ""+title+"", G_HYBRID_MAP);
		cmap.bounds = new google.maps.LatLngBounds(new google.maps.LatLng(bb.s,bb.w),new google.maps.LatLng(bb.n,bb.e));
		if(grouptitle) { cmap.grouptitle = grouptitle; }
		that.baseLayers.push(cmap);
		that.map.addMapType(cmap);
		 
		return null;
		}
	else { return ol; }
	*/
	};


GeoXml.SEMI_MAJOR_AXIS = 6378137.0;
GeoXml.ECCENTRICITY = 0.0818191913108718138;
GeoXml.DEG2RAD = 180.0/(Math.PI);
GeoXml.merc2Lon = function(lon) {
	return (lon*GeoXml.DEG2RAD)*GeoXml.SEMI_MAJOR_AXIS;
	};

GeoXml.merc2Lat = function(lat) {
	var rad = lat * GeoXml.DEG2RAD;
	var sinrad = Math.sin(rad);
	return (GeoXml.SEMI_MAJOR_AXIS * Math.log(Math.tan((rad + Math.PI/2) / 2) * Math.pow(((1 - GeoXml.ECCENTRICITY * sinrad) / (1 + GeoXml.ECCENTRICITY * sinrad)), (GeoXml.ECCENTRICITY/2))));

	};


GeoXml.prototype.toggleLabels = function(on) {
	if(!on) {this.removeLabels();
		}
	else { 
	  	this.addLabels();
		}
	};
GeoXml.prototype.addLabels = function() {
	this.labels.onMap = true;
	this.labels.setMap(this.map); 
	};
 
GeoXml.prototype.removeLabels = function() {
	this.labels.onMap = false;
	this.labels.setMap(null); 
	};

var useLegacyLocalLoad = true;

GeoXml.prototype.DownloadURL = function (fpath,callback,title){
	if(!fpath){ return; }
	var xmlDoc;
	var that=this;
	var cmlurl = fpath;
	
    if (!topwin.standalone && this.proxy) {
        cmlurl = this.proxy + "url=" + escape(cmlurl);
        }


    if (topwin.standalone || useLegacyLocalLoad) {
        if (cmlurl.substring(2, 3) == ":") {
            xmlDoc = new ActiveXObject("Msxml2.DOMDocument.4.0");
            xmlDoc.validateOnParse = false;
            xmlDoc.async = true;
            xmlDoc.load(cmlurl);
            if (xmlDoc.parseError.errorCode != 0) {
                var myErr = xmlDoc.parseError;
                alert ("GeoXml file appears incorrect\n" + myErr.reason + " at line:" + myErr.line );
                }
            else {
		callback(xmlDoc.doc);
                }
            return;
            }
        }
    var cmlreq;
    /*@cc_on @*/
    /*@if(@_jscript_version>=5)
    try{
    cmlreq=new ActiveXObject("Msxml2.XMLHTTP");
    }catch(e){
    try{
    cmlreq=new ActiveXObject("Microsoft.XMLHTTP");
    }catch(E){
    alert("attempting xmlhttp");
    cmlreq=false;
    }
    }
    @end @*/
    if (! cmlreq && typeof XMLHttpRequest != 'undefined') {
        cmlreq = new XMLHttpRequest();
        }
    else {
        if (typeof ActiveXObject != "undefined") {
            cmlreq = new ActiveXObject("Microsoft.XMLHTTP");
            }
        }

    var here = cmlurl;
    if(cmlreq.overrideMimeType) { cmlreq.overrideMimeType("text/xml"); }
    cmlreq.open("GET", here, true);
    cmlreq.onreadystatechange = function () {
        switch (cmlreq.readyState) {
            case 4:
                that.mb.showMess(title+" received", 2000);
                if (typeof ActiveXObject != "undefined") {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    var response = cmlreq.responseText;
		    callback(response);
                    }
                else {
                    if (cmlreq.responseXML) {
                       that.mb.showMess(title+" received", 2000);
                        callback(cmlreq.responseText);
                        }
                    else {
					  if (cmlreq.status == 200) {
							var resp = cmlreq.responseText;
							var sresp = resp.substring(0, 400);
							var isXML = resp.substring(0, 5);
							if (isXML == "<?xml" && sresp.indexOf("kml")!=-1) {
								that.mb.showMess(title+" response received", 2000);
								callback(resp.responseText);
								}
							else {
								that.mb.showMess("File does not appear to be a valid GeoData"+resp,6000);
								}
						   }
						}
                    }
                break;
            case 3:
                that.mb.showMess("Receiving "+title+"...",2000);
                break;
            case 2:
                that.mb.showMess("Waiting for "+title,2000);
                break;
            case 1:
                that.mb.showMess("Sent request for "+title,2000);
                break;
            }
        };

    try {
        cmlreq.send(null);
        }
    catch (err) {
        if (cmlurl.substring(2, 3) == ":" && ! useLegacyLocalLoad) {
            useLegacyLocalLoad = true;
            this.DownloadURL(cmlurl);
            }
        }

};
