
var app = {
	_firstPassage: true,
	_lastLastQuake: {id:0},
	_lastQuake: {id:1},
	_saveSettingsLabel: 'EMSC_App_Settings',
	_settings: EmscConfig.settings,
	_JsonUrl: EmscConfig.api.url,
	_apikey: EmscConfig.api.key,
	_saveApiKeyLabel: 'EMSC_Api_Key',
	//_addon_key: EmscConfig.api.addon_key,
	_appdevice: {},
	_coords:{lat:0,lon:0},
	Location: function(position) {  
		this._coords.lat=position.coords.latitude;  this._coords.lon=position.coords.longitude;
	},
	
	getParams: function() {
		return /*'addon_key='+this._addon_key+'&'+*/this._apikey+'&min_mag='+'1';//this._settings.min_mag; 
		//return {addon_key: this._addon_key, };
	},

	initDb: function() {
		this._db= window.openDatabase("EmscDB", "1.0", "Emsc quakes", 200000);
		this._db.transaction(this.createDb, this.transactionDb_error, this.populateDB_success);
	},
	transactionDb_error: function(error) {
		console.log('transaction Db error '+error);
	},
	populateDB_success: function () {
	
	},
	
	
	refresh_callback:function (req) {
		this._quakes=req.result; console.log('success '+req +"   "+this._quakes.length);
		this._lastLastQuake=this._lastQuake;
		this.isGoodQuakes();
		this.createList();
		this._storage.setItem('saveAllJson',JSON.stringify(this._quakes));  
		
		//alert('normal '+JSON.stringify(quakes[0]));
		//if(this.isNewQuake()) this.setBadgeNew(); 
		if(! this._firstPassage) this.alertAllMethods();
		else if(this._settings.screenAlert){ this.alertScreen(); }
		this._firstPassage=false; 
		//this.refresh_realtime_connect();
	},
	refresh: function() {	
		var self=this;
		this.post_request(this._JsonUrl,this.getParams(),function (req) { self.refresh_callback(req); });
	},
	traitement_realtime:function (msg) {
		//var self=this;
		var data=JSON.parse(msg);  	var quake=data.data; //console.log(JSON.stringify(quake));
		var quakes=JSON.parse(this._storage.getItem('saveAllJson')); 
		
		if(data.data_status=='NEW') { 
			for(var i in quakes) {
				if(quake.time >= quakes[i].time) {
					if(i==0) { this._lastLastQuake=this._lastQuake; this._lastQuake=quake; this.setBadgeNew(); this.alertAllMethods(); }
					else { this.setBadgeNew(); } // new but not the most recent //
					break;
				}
			} 
			this.insertLine_Plus_Before(quake,quakes[i].id);
			quakes.splice(i, 0, quake); //add to array
			ScrollTo('.e_'+quake.id, function() { showMeInstant('.e_'+quake.id); });	
		}		
		else if(data.data_status=='UPDATE') { //alert('UPDATE');
			for(var i in quakes) {
				if(quakes[i].id == quake.id) { quakes.splice(i, 1, quake); break; }
			}	
			if(quake.id == this._lastQuake.id) { this._lastQuake=quake;  this.alertScreen();}
			this.replaceLine_Plus(quake);
			ScrollTo('.e_'+quake.id, function() { showMeInstant('.e_'+quake.id); });	
		}
		else if(data.data_status=='DELETE') { //alert('DEL');
			for(var i in quakes) {
				if(quakes[i].id == quake.id) { quakes.splice(i, 1); break; }
			} 	
			if(quake.id == this._lastQuake.id) { this._lastQuake=quakes[0]; this.alertScreen();  } // if it was the most recent //	
			this.removeLine_Plus(quake);
		}
		
		this._storage.setItem('saveAllJson',JSON.stringify(quakes)); 
		this._quakes=quakes;	
	},
	refresh_realtime_connect: function() {
		this.socket = io.connect(EmscConfig.socket_io.url);
		var self=this;
		this.socket.on('connect', function () {
			//alert('Etat : Connected'); /* ne pas mettre d'alert pour safari dans les functions */
			//socket.on('disconnect', function() { /*self.log('Etat : Disconnected (Fermer)'); */});	
			self.socket.on('message', function (msg) { 
				self.traitement_realtime(msg);
			});
			
		});	
		
	},
	
	isGoodQuakes:function() {  //console.log("check quakes ");  console.log("coords "+this._coords.lat+"  "+this._coords.lon );
		for (var i = 0; i<this._quakes.length; i++) { 
			var show0=(this._quakes[i].magnitude.mag.toFixed(1) >= this._settings.min_mag) ? true : false;
			var show1=(!this._settings.enabledist || (getDistanceFromLatLonInKm(this._coords.lat,this._coords.lon,this._quakes[i].location.lat,this._quakes[i].location.lon) <=  this._settings.MaxDist)) ? true : false;
			var show = show0 && show1; //console.log(this._quakes[i].id+"  "+show0+"  "+show1);
			var audio=(this._quakes[i].magnitude.mag.toFixed(1) >= this._settings.audioAlertMag) ? true : false;
			var shake=(this._quakes[i].magnitude.mag.toFixed(1) >= this._settings.shakeAlertMag) ? true : false;
			this._quakes[i]._params={"show":show,"audio":audio,"shake":shake};
		}
		this._lastQuake=this._quakes[0]; 
	},
	isNewQuake: function() {
		if(this._lastQuake.id != this._lastLastQuake.id) return true;
		else return false;
	},
	setBadgeNew: function() { 
		
	},
	unsetBadgeNew: function() { 
		
	},
	alertAllMethods: function() {
		if(this._settings.screenAlert){ this.alertScreen(); }
		if(this.isNewQuake()) {
			if(this._settings.audioAlert && (this._lastQuake.magnitude.mag.toFixed(1)>= this._settings.audioAlertMag)) { this.alertAudio();}
			if(this._settings.shakeAlert && (this._lastQuake.magnitude.mag.toFixed(1)>= this._settings.shakeAlertMag)) { this.alertShake(); }
		}
	},
	alertShake: function() {
		var mag=(typeof arguments[0]!='undefined') ? arguments[0] : this._lastQuake.magnitude.mag.toFixed(1);
		if(typeof navigator.notification !='undefined') { navigator.notification.vibrate(mag * 500); navigator.notification.beep(3); }
	},
	alertAudio: function() {
		var obj=(typeof arguments[0]!='undefined') ? arguments[0] : {mag:this._lastQuake.magnitude.mag.toFixed(1),region:this._lastQuake.flynn_region,getago:this._lastQuake.time};
		var music=new AudioAlert(obj); 
		music.play(); //gaTrack('AudioAlert');
	},
	alertScreen: function() {
	},
	
	
	
	
	getStorage: function() {
		if(window.localStorage) this._storage=window.localStorage;
		else console.log('no storage');
	},	
	loadStoredSettings: function() {
		var obj=this._storage.getItem(this._saveSettingsLabel);//this._storage.getItem(this._saveSettingsLabel);
		if((typeof(obj)=='string') && (obj!='')) { this._settings=JSON.parse(obj); this.alert('loading new settings from storage string: '+JSON.stringify(this._settings));}
		else if((typeof(obj)=='object') && (obj!=null)) { this._settings=obj; this.alert('loading new settings from storage obj: '+JSON.stringify(this._settings));}
		else { this._storage.setItem(this._saveSettingsLabel,JSON.stringify(this._settings)); /*this.alert('pb load settings  type:'+typeof(obj)+' value:'+obj);*/ }
	},
	setExtensionKey: function(key) {
		this._settings.app_key=key; this._storage.setItem(this._saveSettingsLabel,JSON.stringify(this._settings));
	},
	registerExtensionKey: function() { 
		if(typeof(this._settings.app_key)=='string') return;
		else {
			console.log('send register app'); var self=this;
			this.post_request(EmscConfig.register.app.url,this._appdevice,function(req) { self.setExtensionKey(req.addon_key); }); 
		}	
	},
	saveApiKey:function (key) {
		this._apikey+=key; this._storage.setItem(this._saveApiKeyLabel,this._apikey); this.refresh();
	},
	registerMyAppPush: function(key) {  
		//delete this._settings.appPush_key;
		if(typeof(this._settings.appPush_key)=='string') return;
		else {
			console.log('send push key to register');
			this._settings.appPush_key=key;  var self=this;
			this._storage.setItem(this._saveSettingsLabel,JSON.stringify(this._settings));
			this.post_request(EmscConfig.register.push.url,{ 'platform': device.platform.toLowerCase() , 'push_key': key },function(req) { self.saveApiKey(key); });
		}	
	},
	
	post_serialize: function(obj) {
		/*var str = [];
		for(var p in obj) {
			var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
			str.push(typeof v == "object" ? serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
		}
		return str.join("&");*/
		if(typeof obj=='string') return obj;
		var str = [];
		for(var p in obj)	 str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		return str.join("&");
	},

	post_request:function() {
		var url= ((arguments[0]) ? arguments[0] : '');
		if(url=='') return;
		var data= ((arguments[1]) ? arguments[1] : '');
		var callback= ((arguments[2]) ? arguments[2] : console.log);
		
		$.support.cors = true;
		$.ajax({
				  url: url,
				  type: 'POST',
				  data: data,
				  cache: false,
				  crossDomain: true,
				  dataType: 'json',
				  success: function(req) { 
						//console.log('RESP '+req); 
						callback(req); 
				},
				  error: function( xhr, textStatus, error) {
							console.log(xhr.responseText+' ** '+xhr.status+' ** '+textStatus+' **  '+JSON.stringify(error)+' ** '+JSON.stringify(xhr));
							console.log('error http '+url+' ** '+error.message);
				}
			});	
			
		/*	var xhr = getXhr();
			xhr.onreadystatechange = function(){
				if(xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0 )){
					console.log('Receive: '+xhr.responseText);
					callback(JSON.parse(xhr.responseText)); 
				}
				else console.log(xhr.readyState+' ** '+ xhr.status);
			}
			xhr.open("POST",url,true);
			xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			xhr.send(this.post_serialize(data));
			console.log('send POST='+url+' DATA= '+this.post_serialize(data));	*/
	},
	
	
	
	
	
	find_it: function (id) {
		for (var i = 0; i<this._quakes.length; i++) { 
			if(this._quakes[i].id == id) return i;
		}
	},
	get_it: function(id) {
		return this._quakes[this.find_it(id)];
	},
	get_it_params: function(id,param) {
		return this.get_it(id)[param];
	},	
	map_it: function (id) {
		if(typeof lmap == 'undefined') { setTimeout("app.map_it("+id+")",200); return; }
		var obj=this.get_it(id); //console.log('Obj map it '+JSON.stringify(obj));
		loadData(); lmap.setView([obj.location.lat, obj.location.lon], 8); openPopup(id); 
	},
	
	initQuestio: function() {
		this._questio={};
	},
	setQuestio: function(name,value) {
		console.log('Questio: '+name+' ** '+value); 
		this._questio[name]=value;
	},
	setQuestioCoords: function(values) {
		this._questio['coords']=values;
	},
	sendQuestio: function() {
		//this.post_request(EmscConfig.questio.url,this._questio);
		console.log(this._questio);
	},
	
	
	createDb: function(tx) {
		//tx.executeSql('DROP TABLE IF EXISTS emsc');
		var sql = 
			"CREATE TABLE IF NOT EXISTS emsc ( "+
			//"id INTEGER PRIMARY KEY AUTOINCREMENT, " +
			"evid INTEGER PRIMARY KEY, " +
			"time FLOAT," +
			"mag FLOAT, " +
			"depth FLOAT, " +
			"lat FLOAT, " + 
			"lon FLOAT, " +
			"allJson VARCHAR(500)) ";
		tx.executeSql(sql, null,
                function() {
                    console.log('Create table success');
                },
                function(tx, error) {
                    console.log('Create table error: ' + error.message);
                });
	},
	insertDbAll: function() {
		 var sql = "INSERT OR REPLACE INTO emsc " +
            "(evid, time, mag, depth, lat,lon, allJson) " +
            "VALUES (?, ?,  ?, ?, ?, ?, ?)";
		var quake=this._quakes;
		
		 this._db.transaction(
            function(tx) {
			   for (var i = 0; i<quake.length; i++) { 
					tx.executeSql(sql, [quake[i].evid, quake[i].time, quake[i].magnitude.mag, quake[i].depth.depth, quake[i].location.lat, quake[i].location.lon, JSON.stringify(quake[i])],
							function() {
								console.log('INSERT success');
							},
							function(tx, error) {
								console.log('INSERT error: ' + error.message);
							});
				}
			},
			function(error) {
                console.log("Transaction Error: " + error.message);
            }
        );
			
	},
	
	
	createDateStr: function(str,timeZOffset) {
		var tz=(this._settings.timeZoneOffset==-1) ? timeZOffset : this._settings.timeZoneOffset;
		return new Date(str).utc().setTimeZoneOffset(tz).EmscF()+' UTC'+(this._settings.timeZoneOffset==0 ? '' : da.isoTimezone(tz) );
	},
	insertLine_Plus_Before: function(obj,id) {
		$('.e_'+id).before(this.createLine(obj));  $('.e_'+id).before(this.createLinePlus(obj));
	},
	removeLine_Plus: function(obj) {
		$('.e_'+obj.id).remove(); $('.ep_'+obj.id).remove();
	},
	replaceLine_Plus: function(obj) {
		$('.e_'+obj.id).replaceWith(this.createLine(obj));  $('.ep_'+obj.id).replaceWith(this.createLinePlus(obj));
	},
	createLinePlus: function(obj) {
		return '<li class="resRowP ep_'+obj.id+'">'+
			'<div><span class="icmap"></span>Map it</div>'+'<div><span class="icfelt"></span>I Felt it</div>'+'<div><span class="icdetails"></span>Details</div>'+'<div><span class="iccam"></span>Share pics</div>'
				'</li>';
	},
	createLine: function(obj) {
		return '<li class="resRow e_'+obj.id+'"><a href="javascript:ResRowClick('+obj.id+')" class="handle">' + //'+obj.url + '
				 '<span class="mag">'+obj.magnitude.mag.toFixed(1)+'</span>' + 
						'<strong>' + obj.flynn_region + '</strong><span class="resDetail">'+this.createDateStr(obj.time_str,obj.tz)+'</span>'+ /*Fri, 23 Aug 2013 13:47:59 +0000  obj.time_str*/
						'<span class="resDetail tago" title="'+obj.time_str/*.replace(/\s/g,"_")*/+'">'+da.ago(obj.time_str)+'</span>'+
						'<span>Depth: '+obj.depth.depth+' Km</span>'+
						'<span class="awaydist">'+distVincenty(obj.location.lat, obj.location.lon, this._coords.lat, this._coords.lon).toFixed(1)+' Km away</span>'+'</a></li>';
	},
	createList: function() {
		for (var i = 0; i<this._quakes.length; i++) { 
			if(this._quakes[i]._params.show) $('#quakesList').append(this.createLine(this._quakes[i])+this.createLinePlus(this._quakes[i]));
		}
		console.log('Nb lines '+$('#quakesList li').length);
		if($('#quakesList li').length == 0) $('#quakesList').append('<li class="resRow"> No Results Found ! </li>');
		
		if(useIscroll) loaded($('.wrapper').get(0));
		if(typeof this._timerago != 'undefined') clearInterval(this._timerago);
		this._timerago = setInterval("da.refreshAgo()", 1000*60);
	},
	emptyList: function() { 
		$('#quakesList').empty(); 
	},
 	refreshList:function() {
		this.emptyList(); this.isGoodQuakes(); this.createList();
	},
	getGeoJson: function() {
		var Arr=[]; var color="red";
		for (var i = 0; i<this._quakes.length; i++) { 
			var color=getColor(this._quakes[i].depth.depth);
			var obj={
				type:"Feature",
				geometry:{type:"Point",coordinates:[this._quakes[i].location.lon,this._quakes[i].location.lat]},
				properties:{mag:this._quakes[i].magnitude.mag.toFixed(1),type:"earthquake",popupContent: this.createLine(this._quakes[i]) },
				geojsonMarkerOptions:{radius: (this._quakes[i].magnitude.mag.toFixed(1)*2), fillColor: color, color: color, opacity: 0.7, fillOpacity: 0.6 },
				id: this._quakes[i].id
			};	
			Arr.push(obj);
		}
		return Arr;
	},
	
	
	getAll: function() {
		var self=this; var quakes;
		this._db.transaction(
            function(tx) {
                var sql = "SELECT * from emsc ORDER BY time desc";

                tx.executeSql(sql, [], function(tx, results) {
                    var len = results.rows.length, quake = [],
                        i = 0;
                    for (; i < len; i = i + 1) {
                        quake[i] = results.rows.item(i);
						quakes[i]=JSON.parse(quake[i].allJson);
                    }
					self._quakes=quakes;
                });
            },
            function(error) {
               console.log("Transaction Error: " + error.message);
            }
        );
	},
	
	
	sendToJava: function() {
		console.log("send settings 0"); 
		if( isAndroid ) { console.log("send settings 1"); pushNotification.NotificationSettings(successPushH , errorPushH , {"settings":this._settings,"mycoords":this._coords});	}
	},
	alert: function(txt) {
		console.log('Alert '+txt);
	},
	
	isApiKey: function() {
		var key=this._storage.getItem(this._saveApiKeyLabel);
		if(typeof key=='string') {this._apikey=key; return true;}
		return false;
	},
	initapp: function() {
		var self=this;
		localise(function(location) { self.Location(location); });
		this.getStorage();
		this.loadStoredSettings(); 
		this.sendToJava();
		//this.registerExtensionKey();
		try {
			//var e=this._storage.getItem('saveAllJson'); console.log('saveAllJson '+typeof e);  console.log('e= '+e); 
			this._quakes=JSON.parse(this._storage.getItem('saveAllJson'));    //console.log('quakes= '+this._quakes);
		} catch(e) { console.log('no quakes in storage'); }	
		//this.initDb();		//this.getAll();
		/*if(! this._quakes ) { console.log('nothing in db'); this.refresh();}
		else this.createList();*/
		
		//this.refresh();
	}
	
};	

function AudioAlert() { 
	this.music,	this.codec,	this.url;
	this.uri= EmscConfig.audio.url;
	this.params= ((arguments[0]) ? arguments[0] : EmscConfig.audio.test);
	this.init= function() { 
		this.setCodec(); 
		this.getUri();
	};
	this.getUri= function() {
		this.url=this.uri+'get.'+this.codec+'?';
		for (var lab in this.params) {  this.url+=lab+"="+escape(this.params[lab])+"&"; } this.url=this.url.substring(0,this.url.length-1);
	};
	this.setCodec= function() { 
		this.codec='mp3';
	};
	this.play= function() { 
		if(typeof Media =='undefined') return;
		var my_media = new Media(this.url,
			function () {
				console.log("playAudio():Audio Success");
				my_media.release();
				my_media = null;
			},
			// error callback
			function (err) {
				console.log("playAudio():Audio Error: " + err);
			}
		);
		// Play audio
		my_media.play();
	};
	
	this.init();
	return this;
}

Date.prototype.EmscF=function() {
	var t=this, s=t.getUTCFullYear(),o=t.getUTCMonth()+1,u=t.getUTCDate(),a=t.getUTCHours(),f=t.getUTCMinutes(),l=t.getUTCSeconds(),c=t.getUTCMilliseconds(),h=[];
	//return [s,"-",o<10?"0":"",o,"-",u<10?"0":"",u," ",a<10?"0":"",a,":",f<10?"0":"",f,":",l<10?"0":"",l].join("");
	var g=this.toString().split(" ");
	return [g[0],", ",g[2]," ",g[1]," ",g[3]," ",g[4]].join("");
};
Date.prototype.setTimeZoneOffset=function(t) { return new Date(this.getTime()+(t*60000)); };
Date.prototype.utc=function() { return new Date(this.setTime(this.getTime()+this.getTimezoneOffset()*60000)); };


var da={
	_d: new Date(), //_timeZ:this._d.getTimezoneOffset(),
	set:function(d) { this._d=new Date(d); return this; },
	setTimeZoneOffset:function(t) { return this.set(this.getTime()+(t*60000)); },
	isoTimezone:function(e){var t=Math.abs(e),n=parseInt(t/60,10),r=t%60;return[e<0?"-":"+",n<10?"0":"",n,":",r<10?"0":"",r].join("")},
	formatAgo:function(n) { return n < 10 ? '0'+n : n; },
	ago:function(time) {
		var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")), diff = (((new Date()).getTime() - date.getTime()) / 1000), day_diff = Math.floor(diff / 86400);
		if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) return '';
			
		return day_diff == 0 && (
			diff < 60 && "just now" || 	diff < 120 && "1 min ago" ||
			diff < 3600 && Math.floor(diff/60) + " min ago" || diff < 86400 && Math.floor( diff / 3600 ) + " hr  &nbsp;" + this.formatAgo(Math.floor((diff/60) - (Math.floor(diff/3600)*60))) + " min ago") ||
			day_diff == 1 && "Yesterday" || day_diff < 7 && day_diff + " days ago" || day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
	},
	refreshAgo:function() {
		var self=this;
		$('.tago').each(function(){ 
			$(this).html(self.ago($(this).attr('title')));
		});	
	}
};
/*
function registerMyAppPush(key) {
	console.log('send push key to register');
	$.support.cors = true;
	$.ajax({
			  url: EmscConfig.register.push.url,
			  type: 'POST',
			  data: { 'platform': device.platform.toLowerCase() , 'push_key': key  },
			  cache: false,
			  crossDomain: true,
			  dataType: 'json',
			  success: function(req) { console.log('send GCM register key Success');},
			  error: function( xhr, textStatus, error) {
						console.log(xhr.responseText+'  '+xhr.status+'  '+textStatus);
						console.log('error http1 '+error.message);
			}
		});	
}
*/
 
 function Push() {
	$("#app-status-ul").append('<li> Platform : '+device.platform+'</li>');
	try {
		//pushNotification = window.plugins.pushNotification;
		if (device.platform == 'android' || device.platform == 'Android') {
			$("#app-status-ul").append('<li>registering android</li>');
			pushNotification.register(successPushH , errorPushH , {"senderID":EmscConfig.android.senderID,"ecb":"onNotificationGCM"});		// required!
		} else {
			$("#app-status-ul").append('<li>registering iOS</li>');
			pushNotification.register(tokenHandler, errorPushH, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});	// required!
		}	
    }catch(error) { console.log('error push register '+error.message);}            	
 }
function successPushH (result) {
    $("#app-status-ul").append('<li>success:'+ result +'</li>');
}         
function errorPushH (error) {
	$("#app-status-ul").append('<li>error:'+ error +'</li>');
}
function tokenHandler (result) {
	$("#app-status-ul").append('<li>token: '+ result +'</li>');
	// Your iOS push server needs to know the token before it can push to this device
	// here is where you might want to send it the token for later use.
}
  // handle APNS notifications for iOS
function onNotificationAPN(e) {
	if (e.alert) {
		 $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
		 navigator.notification.alert(e.alert);
	}
		
	if (e.sound) {
		var snd = new Media(e.sound);
		snd.play();
	}
	
	if (e.badge) {
		pushNotification.setApplicationIconBadgeNumber(successHandler, e.badge);
	}
}

// handle GCM notifications for Android
function onNotificationGCM(e) {
	$("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');
	//console.log('GCM '+print_r(e));  console.log('GCM '+print_r(e.payload));
	switch( e.event ) {
		case 'registered':
		if ( e.regid.length > 0 ) {
			$("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
			// Your GCM push server needs to know the regID before it can push to this device
			// here is where you might want to send it the regID for later use.
			console.log("regID = " + e.regid);
			//registerMyAppPush(e.regid);
			app.registerMyAppPush(e.regid);
		}
		break;
		
		case 'message':
			console.log('notify '+JSON.stringify(e.payload.message_data));
			
			// if this flag is set, this notification happened while we were in the foreground.
			// you might want to play a sound to get the user's attention, throw up a dialog, etc.
			if (e.foreground) { 
				$("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');
				// if the notification contains a soundname, play it.
				//var my_media = new Media(e.payload.soundToPlay/*"/android_asset/www/"+e.soundname*/);
				//my_media.play();
				/*if(e.payload.soundToPlay) {
					var music=new AudioAlert(e.payload.soundToPlay); 
					music.play();
				}	*/
			
			}
			else {	// otherwise we were launched because the user touched a notification in the notification tray.
				if (e.coldstart) $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
				else $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
			}
			
			
			var mem=app._settings.audioAlert;
			if (!e.foreground) app._settings.audioAlert=false;
			app.traitement_realtime(JSON.stringify(e.payload.message_data));
			app._settings.audioAlert=mem;

			$("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
			$("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
			
		break;
		
		case 'error':
			$("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
		break;
		
		default:
			$("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
		break;
	}
}

function getXhr() {
	var xhr = null; 
	if(window.XMLHttpRequest)  xhr = new XMLHttpRequest();  // Firefox et autres
	else if(window.ActiveXObject){ // Internet Explorer 
	   try { xhr = new ActiveXObject("Msxml2.XMLHTTP"); }
	   catch (e) { xhr = new ActiveXObject("Microsoft.XMLHTTP"); }
	}
	else {  xhr = false;  /*alert("Ajax Error - HttpRequest unsupported");*/ } // XMLHttpRequest non supporté par le navigateur 
	return xhr;
} 
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI/180)
}
 
 function ResRowClick(id) {

	if($('.e_'+id).hasClass('resRowsel')) { $('.resRowP').slideUp('slow'); $('.resRowsel').removeClass('resRowsel'); return; }
	$('.resRowsel').removeClass('resRowsel');  $('.resRowP').hide();
	
	$('.e_'+id).addClass('resRowsel');
	$('.ep_'+id).slideDown('slow',function(){
		//$('.icmap').parent().click(function(e) { e.stopPropagation(); console.log('map it '+id);});
		 $(this).children().click(function(e) {  
			e.stopPropagation(); 
			//console.log(e); console.log(e.target.id); 
			//console.log($(this).children().attr('class'));
			//var obj=app.find_it(id);
			switch($(this).children().attr('class')) {
				case 'icmap' :
					$("a[href$='Emap']").trigger('click',function() { app.map_it(id);  });  break;
				case 'icdetails' :
					window.location=app.get_it_params(id,'url'); /*obj.url;*/ break;
				case 'icfelt':
					 app.initQuestio(); app.setQuestio('evid',id); init_questio_css(); spriteFeltit(); $('#FeltitLnk').trigger('click');
						break;	
				case 'iccam':
					Allcam(); $('#fullcam').fadeIn(1000); $('#fullcam').css('background','rgba(0,0,0,0.8)');//.css('opacity','0.6');
					//ScrollTo('.e_326593', function() { showMeInstant('.e_326593'); });	
						break;
			}
		});
	}).click(function(){ $(this).slideUp(); $('.resRowsel').removeClass('resRowsel');  }); 
 }
 function init_questio_css() { $('#comment').removeClass('hidden').addClass('hidden'); $('.thumb').show(); }
 function spriteFeltit() { //console.log('ln '+$('#thumb').children().length); console.log($('#thumb').children());
	if($('#thumb').children().length > 0) return;
	var z=0;
	for(var i=1;i<=12;i++) { $('#thumb').append('<span class="vignt" id="v'+i+'" style="background-position:'+z+'px 0;"/>'); z-=240;  }
	$('.vignt').each(function(){ 
		$(this).click(function(e){ 
			app.setQuestio('intensity',e.target.id.substr(1)); continue_questio();
		});
	});	
 }
 function questio_end() {
	app.setQuestio('email',$('#ques_email').val());  app.setQuestio('comments',$('#ques_comments').val()); app.sendQuestio();
	$('#Feltit').fadeOut(1000, function() { $('#comment').addClass('hidden');  $('.thumb').slideDown(); $(this).removeClass('visible').addClass('hidden').css('display',''); });
	$('#home .wrapper').css("left","0"); $('#home').fadeIn(1000, function() { $(this).addClass('visible').removeClass('hidden').css('display',''); }); 
	//$('.thumb').show().;   
 }
 function continue_questio() {
	localise(app.setQuestioCoords);
	$('.thumb').slideUp();	$('#comment').removeClass('hidden');	$('#comment').slideDown();
 }
 
 
 
 
 function localise(myCallback) {
	if (!navigator.geolocation) { console.log("geolocation API not supported", "Error"); }
	else {
		console.log('launch pos');
		navigator.geolocation.getCurrentPosition( myCallback ,
			/*function(position) {
				EmscConfig.video.coords=position;
			}, */
			function(error) {console.log('error position code: '+error.code+ '\n' +'message: ' + error.message + '\n');}
		);
	}
}

 
 
 function Allcam() {
	if($('#allcams').children().length > 0) return;
	$("head").append('<script src="js/capture.js" />'); 
	var str='<div><span class="iccam0"></span>Take Picture</div> <div><span class="iccam2"></span>Take Video</div> <div><span class="iccam3"></span>From Gallery</div> <div><span class="iccam4"></span>From Photos</div>';
	if(isAndroid) str='<div><span class="iccam0"></span>Take Picture</div> <div><span class="iccam2"></span>Take Video</div><div class="camandroid"><span class="iccam4"></span>From Gallery/Photos</div>';
	$('#allcams').append(str);
	$('#fullcam').click(function(e) {$(this).fadeOut(1000); });
	$('#allcams div').each(function(){ 
		$(this).click(function(e){ 
			e.stopPropagation(); 
			switch($(this).children().attr('class')) {
				case 'iccam0':
					/*Picture(Camera.PictureSourceType.CAMERA);*/ captureVideo_Photo('image'); break;
				case 'iccam2':
					captureVideo_Photo('video'); break;
				case 'iccam3':
					Picture(Camera.PictureSourceType.PHOTOLIBRARY); break;	
				case 'iccam4':
					Picture(Camera.PictureSourceType.SAVEDPHOTOALBUM); break;		
			}
		});
	});	
 }
 
 
 function FireEvent(name,element) {
	var event;
	  if (document.createEvent) {
		event = document.createEvent("HTMLEvents");
		event.initEvent(name, true, true);
	  } else {
		event = document.createEventObject();
		event.eventType = name; event.type=name; event.name=name;
	  }

  event.eventName = name;
  //event.memo = memo || { };

  if (document.createEvent) element.dispatchEvent(event);
  else  element.fireEvent("on" + event.eventType, event);
  
 }
 
 

function print_r(theObj){
	var str='';
	if(theObj.constructor == Array ||	theObj.constructor == Object) {
		str+="\n";
		for(var p in theObj){
			if((theObj[p].constructor == Array || theObj[p].constructor == Object)) { //&&("function"!=typeof(theObj))
				str+="\t["+p+"] => "+typeof(theObj)+"\n";
				str+="\n";
				str+=print_r(theObj[p]);
				str+="\n";
			} else {
				str+="\t["+p+"] => "+theObj[p]+"\n";
			}
		}
		str+="\n";
	}
	return str;
}


function checkConnection() {
	if( typeof navigator == 'undefined' || typeof navigator.connection == 'undefined' ) return;
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';

    console.log('Connection type: ' + states[networkState]);
	if(networkState == Connection.NONE) { navigator.notification.alert('Internet connection is Required!', internetcallback, "ERROR", "OK"); return false; }
	return true;
}
function internetcallback() {
	console.log('internet connection callabck');
}


function test() {
	window.GCMIntentService.setResult("blah blah ");//+new Date().toString());
	/*app.getStorage();
	app.loadStoredSettings();
	GCMIntentService.setResult(JSON.stringify(app._settings));*/
}