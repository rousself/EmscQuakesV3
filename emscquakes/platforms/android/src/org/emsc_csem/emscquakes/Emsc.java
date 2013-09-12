package org.emsc_csem.emscquakes;

import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.Log;

public class Emsc {
	public final static double AVERAGE_RADIUS_OF_EARTH = 6371;
	public final static String SAVE_FILE = "saving.txt";
	public static JSONObject settings;
	public static JSONObject myLatLon;
	
	public static boolean loadAll(Context ctx ) throws IOException, JSONException {
		try {
			Log.d("Storage","path "+ctx.getFilesDir().toString());
			
			File file = ctx.getFileStreamPath(SAVE_FILE);
			if(!file.exists()) return false;
			/*
			File[] files=ctx.getFilesDir().listFiles();
			 for (File file : files){
			      Log.d("testage",file.getPath().toString());  
			 }*/
			FileInputStream fos = ctx.openFileInput(SAVE_FILE);
			InputStreamReader inputStreamReader = new InputStreamReader(fos);
		    BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
		    StringBuilder sb = new StringBuilder();
		    String line;
		    while ((line = bufferedReader.readLine()) != null) {
		        sb.append(line);
		    }
			fos.close();
			Log.d("Storage","LU From storage: "+sb.toString());
			Emsc.settings=(JSONObject) new JSONObject(sb.toString()).get("settings");
			Emsc.myLatLon=(JSONObject) new JSONObject(sb.toString()).get("coords");
		} 
		catch(FileNotFoundException e) { Log.e("Error EMSC", e.toString()); }
		
		return true;
	}
	public static void saveSettings(JSONObject latlon, JSONObject settings,Context ctx) throws JSONException, IOException {
		try {
			Log.d("Storage","write: "+ctx.getFilesDir().toString());
			JSONObject ob=new JSONObject("{coords:"+latlon.toString()+",settings:"+settings.toString()+"}");
			FileOutputStream fos = ctx.openFileOutput(SAVE_FILE, Context.MODE_PRIVATE);
			fos.write(ob.toString().getBytes());
			fos.close();
		} 
		catch(FileNotFoundException e) { Log.e("Error EMSC", e.toString()); }
	}
	public static int calculateDistance(double userLat, double userLng, double venueLat, double venueLng) {

		double latDistance = Math.toRadians(userLat - venueLat);
		double lngDistance = Math.toRadians(userLng - venueLng);

		double a = (Math.sin(latDistance / 2) * Math.sin(latDistance / 2)) +
						(Math.cos(Math.toRadians(userLat))) *
						(Math.cos(Math.toRadians(venueLat))) *
						(Math.sin(lngDistance / 2)) *
						(Math.sin(lngDistance / 2));

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return (int) (Math.round(AVERAGE_RADIUS_OF_EARTH * c));

	}
	
	@SuppressLint("SimpleDateFormat")
	public static boolean isgoodHour(int soirH,int soirM,int matinH, int matinM) {
		
		boolean isgood=false;
		//create Date object
		Date date = new Date();
	   
		 SimpleDateFormat sdf = new SimpleDateFormat("a");  //AM /PM
		 SimpleDateFormat Hour = new SimpleDateFormat("HH"); int H=Integer.parseInt(Hour.format(date));
		 SimpleDateFormat Min = new SimpleDateFormat("mm");  int M=Integer.parseInt(Min.format(date));
		 
		 //Log.d("testER","Time with AM/PM field : " + sdf.format(date));
		
		 boolean isgoodH=(H <= soirH) || ( H >= matinH );
		 boolean isgoodM=true;
		 if((H == soirH) && (H==matinH)) {
			 isgoodM=(M <= soirM) || ( M >= matinM );
		 }
		 else if(H==soirH) {
			 isgoodM=(M <= soirM);
		 }
		 else if(H==matinH) {
			 isgoodM=(M >= matinM);
		 }
		 
		return isgoodH && isgoodM;
	}	
	
	public static boolean canPlaySound(JSONObject EData,Context ctx) throws JSONException, IOException {
		if(! loadAll(ctx)) return false;
		boolean isgood=false;
	
		if(settings.getBoolean( "enablenight" )) {
//{"min_mag":5,"enabledist":true,"MaxDist":200,"enablefelt":true,"timeZoneOffset":-120,"AudioAlert":true,"AudioAlertMag":1,"enablenight":false,"nightmin_h":22,"nightmin_m":0,"nightmax_h":7,"nightmax_m":0,"nightDist":200,"night.felt":true,"ShakeAlert":true,"shakeAlertMag":1,"ShakeMagTest":5,"timer":2}
			Log.d("DataNIGHT","Active");
			if(settings.getBoolean( "ANightDist" )) {
				int DistMax=settings.getInt( "nightDist" );
				JSONObject coords=EData.getJSONObject("location");
				int Dist=calculateDistance(myLatLon.getDouble("lat"), myLatLon.getDouble("lon"), coords.getDouble("lat"), coords.getDouble("lon"));
				Log.d("DataNIGHT","lat:"+coords.getDouble("lat")+"  lon:"+coords.getDouble("lon")+"  Dist:"+Dist+"  Distance auorised:"+settings.getInt("nightDist"));
				isgood=(Dist <= settings.getInt("nightDist")) ? true : false;
				
			}
			else isgood=true;
			
			boolean isgoodH=isgoodHour(settings.getInt("nightmin_h"), settings.getInt("nightmin_m"), settings.getInt("nightmax_h"), settings.getInt("nightmax_m"));
			
			isgood= isgoodH && isgood ;
			Log.d("DataNIGHT","hour is:"+ isgoodH);
			
			return isgood;
		}
		else return false;
	}
	
}