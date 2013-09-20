
function getExtSettings() {
	var set=app._storage.getItem(app._saveSettingsLabel);
	if((typeof(set)=='string') && (set!='')) { return JSON.parse(set);}
	else {	return  '';	}	
}

function saveExtSettings(csettings) {
	var old_settings=getExtSettings();
	app._storage.setItem(app._saveSettingsLabel,JSON.stringify(csettings));  app.loadStoredSettings();
	//if(JSON.stringify(old_settings)!==JSON.stringify(csettings)) app.refreshList();
	//if(old_settings.min_mag!==csettings.min_mag) { app.emptyList();app.refresh(); /*app.refreshList();*/ }
	//else if(old_settings.timeZoneOffset!==csettings.timeZoneOffset) app.refreshList();
	app.refreshList();
	app.sendToJava();
}
function loadOptions() {
	setTimeout('loadOptions_suite()',300); 
}
function loadOptions_suite() { 
	var settings=getExtSettings();
	if(typeof(settings)!='object') return;
	
	for(var i in settings) {
		var name=i, val=settings[i], sel='#'+name;
		sel=($(sel).length <0) ? "[name='"+name+"']" : sel;
		if( $(sel).length <0) { /*console.log('not found '+sel);*/ continue;}
		if( typeof val=="boolean") $(sel).prop('checked',val);
		else $(sel).val(val);
	}
	
	disable_enable("dist",$('#enabledist').is(':checked')); 
	disable_enable("night",$('#enablenight').is(':checked')); 
	disable_enable("audio",$('#AudioAlert').is(':checked')); 
	disable_enable("shake",$('#ShakeAlert').is(':checked')); 
}	

function save_options() {
	var csettings={}; 
	
	$('#options input,#options select').each(function(){ 
	//	console.log($(this).attr('id')+" **** "+$(this).attr('name') );
		var name=$(this).attr('name') ? $(this).attr('name') : $(this).attr('id') ;
		var val;
		switch(this.nodeName.toLowerCase()) {
			case "input":
				switch($(this).attr('type')) {
					case "number" : val=parseInt($(this).val()); break;
					case "checkbox" : val=$(this).is(':checked'); break;
					case "radio" : val=$('#options input[name='+name+']:checked').val(); break;
				}
				break;
			case "select" : val=parseInt($(this).val()); break;
		}
	
		csettings[name]=val;  //console.log(name+'  '+val+'  '+typeof val+'  '+this.nodeName.toLowerCase());
	});
	saveExtSettings(csettings);	
}

function playAudioTest() {
	app.alertAudio({mag:4.5,region:'CENTRAL ITALY',ago:4});
	//var music=new AudioAlert(({mag:4.5,region:'CENTRAL ITALY',ago:4}); music.play();
}

function ShakeTest() { 
	var mag=parseInt(document.getElementById("ShakeMagTest").value);
	app.alertShake(mag);
}
function disable_enable(what,enable) {
	var inp,lab;
	switch(what) {
		case "audio": inp='.audioalert input'; lab='.audioalert'; break;
		case "shake": inp='.shakealert input'; lab='.shakealert'; break;
		case "dist":  inp='.maxdistc p select'; lab='.maxdistc'; break;
		case "night":  inp='.night select,.night input'; lab='.night'; break;
	}
	//console.log(what+" **  "+inp+" **  "+lab+" ** "+enable);
	//$(inp).prop('disabled', !enable); 
	//if(enable) $(lab).prop("disabled", false); //$(lab).removeClass('inactif'); 
	//else $(lab).prop("disabled", true);//.addClass('inactif'); 
	//$(inp).prop('disabled', !enable); 
	if(enable) $(lab).prop("disabled", false).removeClass('inactif'); 
	else $(lab).prop("disabled", true).addClass('inactif'); 
		
}
//$(document).ready(function() {
	//$('#savebt').click(function() { save_options(); return false;});
	$('#playaudio').click( function() { playAudioTest(); return false; });
	$('#shaketest').click( function() { ShakeTest(); return false;});
	$('#Esetting').bind('hideIt', function() { console.log('hide'); save_options(); });
	
	//alert(da.isoTimezone(-1*new Date().getTimezoneOffset()));
	$('#localT').html( function (index,html) { return html+' (UTC'+da.isoTimezone(-1*new Date().getTimezoneOffset())+')'; });
	$('.timezlocal').val(new Date().getTimezoneOffset());
	
	$('.hours').each(function() {
		for(var i=0;i<=23;i++) { $(this).append("<option value='"+i+"'>"+(i<10 ? "0"+i : i)+"</option>"); }
	});
	$('.minutes').each(function(){ 
		for(var i=0;i<=59;i++) { $(this).append("<option value='"+i+"'>"+(i<10 ? "0"+i : i)+"</option>"); }
	});
	
	$("#nightmin_h").val(22); $('#nightmin_m').val(0);   $('#nightmax_h').val(7); $('#nightmax_m').val(0); 
	
	$('#enabledist').click(function() { disable_enable("dist",$(this).is(':checked')); });
	$('#enablenight').click(function() { disable_enable("night",$(this).is(':checked')); });
	$('#AudioAlert').click(function() { disable_enable("audio",$(this).is(':checked')); });
	$('#ShakeAlert').click(function() { disable_enable("shake",$(this).is(':checked')); });
	
	function createDistOption() {
		var dist=[50,100,200,300,400,500,1000,1500,2000,3000,5000,10000, 20000];//,'All'];
		for(var i=0;i<dist.length;i++) { $('#MaxDist,#nightDist').append("<option value='"+dist[i]+"'>"+dist[i]+"</option>"); }
		$('#MaxDist,#nightDist').val(200);
	}	
	$('input[type=radio],input[type=checkbox]').each(function(){ 
		var id=$(this).attr('id');
		if (typeof $(this).attr('id') == "undefined") { id=this.name+"_"+Math.random().r;  $(this).attr('id',id); }
		var cl='regular-radio big-radio';
		if( this.type == "checkbox") cl='regular-checkbox big-checkbox';
		$(this).addClass(cl); $(this).after("<label for='"+id+"'></label>");
	});
	
	
	createDistOption();
	loadOptions();
	/*MyAnalytics();*/ //gaTrack('options.html');
	
 //});

