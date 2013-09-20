// Called when capture operation is finished
function captureSuccess(mediaFiles) {
	var i, len;
	for (i = 0, len = mediaFiles.length; i < len; i += 1) {
		uploadToServer(mediaFiles[i].fullPath,mediaFiles[i].name);
	}       
}

// Called if something bad happens.
function captureError(error) {
	var msg = 'An error occurred during capture: ' + error.code;
	navigator.notification.alert(msg, null, 'Uh oh!');
}

function uploadToServer(mediaFilePath,name) {
		 $('.mymessage').html('Please wait!'); $('.messages').fadeIn(1000);
		var ext=name.split('.').pop();
		var options = new FileUploadOptions();
		options.fileName=name; options.fileKey='Filedata';
		switch (ext) {
			case "jpeg": 
			  options.mimeType="image/jpeg";
			  break;
			case "png": 
			  options.mimeType="image/png";
			  break;  
			 case "mp4": 
			  options.mimeType="video/mp4";
			  break; 
		} console.log('Extension '+ext+' ** '+name);
		options.params=jQuery.extend(EmscConfig.video.params, EmscConfig.video.coords);//EmscConfig.video.params;
		$('#status').removeClass('hide');
		var statusDom=$('.mymessage').get(0); statusDom.innerHTML += '<br>Loading...<br><p class="loader"></p>'
		var ft = new FileTransfer();
		ft.onprogress = function(progressEvent) {
			if (progressEvent.lengthComputable) {
				var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
				$('.loader').html( perc + "% loaded..." );
			} else {
				if(statusDom.innerHTML == "") statusDom.innerHTML = "Loading";
				else statusDom.innerHTML += ".";
			}
		};
		ft.upload(mediaFilePath, EmscConfig.video.url, winTrans, failTrans, options);
		setTimeout(setInfoPetit,3000);
}
function winTrans(r) {
	console.log("Code = " + r.responseCode);
	console.log("Response = " + r.response);
	console.log("Sent = " + r.bytesSent);
	$('#status').addClass('hide'); 
	//$('#fullcam').addClass('hidden');
	$('#mymess').html('The file was uploaded successfully');
	$('#mymess').click(function(e) {$(this).fadeOut(1000);  $('.wrapper').removeClass('wrapper2');});

}
function failTrans(error) {
	console.log("An error has occurred: Code = " + error.code);
	console.log("upload error source " + error.source);
	console.log("upload error target " + error.target);
	$('#status').addClass('hide');
	//$('#fullcam').addClass('hidden');
	$('#mymess').html('Error during uploading the file. Please try later!');
	$('#mymess').click(function(e) {$(this).fadeOut(1000); $('.wrapper').removeClass('wrapper2'); }); 
}


function setCoordsVideo(position) { EmscConfig.video.coords=position; }
// A button will call this function
function captureVideo_Photo(n) {
	$('#fullcam').fadeOut(1000); $('.mymessage').html('Please wait!'); $('.messages').fadeIn(1000);
	localise(setCoordsVideo);
	if(n=="video") captureVideo();
	else captureImage();
}

function captureVideo() {
// Launch device video recording application,  allowing user to capture up to 2 video clips
	navigator.device.capture.captureVideo(captureSuccess, captureError, {limit: 1});
}	
function captureImage() {
	navigator.device.capture.captureImage(captureSuccess, captureError, {limit: 1});
}
function Picture(SourceType) {
	$('#fullcam').fadeOut(1000);
	localise(setCoordsVideo);
	navigator.camera.getPicture(
            function(imageData) {  console.log('ok picture');
				var npath = imageData.replace("file://localhost",'');
				//See more at: http://blog.workinday.com/application_smartphone/308-phonegap-prendre-et-uploader-une-photo-sur-ios-et-android.html#sthash.aazXljrv.dpuf
				uploadToServer(npath,npath.substr(npath.lastIndexOf('/')+1));
               // $('#image').attr('src', "data:image/jpeg;base64," + imageData);
            },
            function() { 
				console.log('Error taking picture');   
			},
            { quality: 50, targetWidth:600, encodingType: Camera.EncodingType.JPEG, mediaType:Camera.MediaType.ALLMEDIA,destinationType:Camera.DestinationType.FILE_URI/*,saveToPhotoAlbum:true*/, sourceType: SourceType }	
     
	 );
			   // destinationType: Camera.DestinationType.DATA_URL, //0=DATA_URL (base64), 1=FILE_URI, 2=NATIVE_URI
				//sourceType: 1,      // 0:Photo Library, 1=Camera, 2=Saved Photo Album
				// mediaType:    PICTURE: 0,  VIDEO: 1,  ALLMEDIA : 2   // 
				//encodingType: 0 ,    // 0=JPG 1=PNG
				//saveToPhotoAlbum: true,
}
function setInfoPetit() {
	$('#mymess').html('<span class="loader loader2" ></span>Please Wait!');
	$('.mymessage').html(''); $('.messages').fadeOut(500); 
	$('.wrapper').addClass('wrapper2');
	$('#mymess').fadeIn(500);
}


function notify(){
 navigator.notification.vibrate(2500); navigator.notification.beep(3);
}

function testAudio() {
	var music=new AudioAlert(); 
		music.play();
}	
