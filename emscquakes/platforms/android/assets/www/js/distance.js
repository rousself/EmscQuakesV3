function distVincenty(lat1, lon1, lat2, lon2) {
  var a = 6378137, b = 6356752.314245,  f = 1/298.257223563;  // WGS-84 ellipsoid params
  var L = torad((lon2-lon1));
  var U1 = Math.atan((1-f) * Math.tan(torad(lat1)));
  var U2 = Math.atan((1-f) * Math.tan(torad(lat2)));
  var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
  
  var lambda = L, lambdaP, iterLimit = 100;
  do {
	var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
	var sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) + 
	  (cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda));
	if (sinSigma==0) return 0;  // co-incident points
	var cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda;
	var sigma = Math.atan2(sinSigma, cosSigma);
	var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
	var cosSqAlpha = 1 - sinAlpha*sinAlpha;
	var cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha;
	if (isNaN(cos2SigmaM)) cos2SigmaM = 0;  // equatorial line: cosSqAlpha=0 (§6)
	var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
	lambdaP = lambda;
	lambda = L + (1-C) * f * sinAlpha *
	  (sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
  } while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0);

  if (iterLimit==0) return NaN  // formula failed to converge

  var uSq = cosSqAlpha * (a*a - b*b) / (b*b);
  var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
  var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
  var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
	B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
  var s = b*A*(sigma-deltaSigma);
  
  s = s.toFixed(3); // round to 1mm precision
  return s/1000; //m to km
} 

function coordobs(point,brng, dist) {
  var R = 6371;
  var d = parseFloat(dist)/R;  // d = angular distance covered on earth\'s surface
  var lat1 = torad(point[0]), lon1 = torad(point[1]);
  brng = torad(brng);

  var lat2 = lat1 + d*Math.cos(brng);
  var dLat = lat2-lat1;
  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  var q = (!isNaN(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1);  // E-W line gives dPhi=0
  var dLon = d*Math.sin(brng)/q;
  // check for some daft bugger going past the pole
  if (Math.abs(lat2) > Math.PI/2) lat2 = lat2>0 ? Math.PI-lat2 : -(Math.PI-lat2);
  lon2 = (lon1+dLon+3*Math.PI)%(2*Math.PI) - Math.PI;
 
  return new Array(todeg(lat2), todeg(lon2));
}

function torad(x) { return (x * (Math.PI / 180)); }
function todeg(x) { return (x * (180 / Math.PI )); } 
function todeg_bearing(x) {return (todeg(x)+360) % 360; }
function get_angle(lat1, lon1, lat2, lon2) {
  var dLon = torad((lon2-lon1));
  var dPhi = Math.log(Math.tan(torad(lat2)/2+Math.PI/4)/Math.tan(torad(lat1)/2+Math.PI/4));
  if (Math.abs(dLon) > Math.PI) dLon = dLon>0 ? -(2*Math.PI-dLon) : (2*Math.PI+dLon);
  return todeg_bearing(Math.atan2(dLon, dPhi));
}
function get_direction(my_angle) {
	var tb=new Array(),diff2=1000,dir="";
	tb["N"]=0; tb["NE"]=45; tb["E"]=90; tb["SE"]=135; tb["S"]=180; tb["SW"]=225; tb["W"]=270; tb["NW"]=315;
	for(var i=0; i<tb.length;i++) {
		var diff=tb[i]-my_angle;
		if(Math.abs(diff) < diff2)  {diff2=Math.abs(diff); dir=i; } 
	}	
	return dir;
} 

function dir_to_angle(ang) {
	var angle= 0;
	switch(ang)
	{
		case "N": angle = 0;
		break;
		case "NE": angle = 45;
		break;
		case "E": angle =90;
		break;
		case "SE": angle = 135;
		break;
		case "S": angle = 180;
		break;
		case "SW": angle = 225;
		break;
		case "W": angle = 270;
		break;
		case "NW": angle = 315;
		break;
	}
	return angle;
}