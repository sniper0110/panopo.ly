<?php
	require('panopoly.php');
	require('cubemap.php');
	require('ffmpeg.php');

	//	limit to X min processing
	set_time_limit( 10*60 );

	$InputFilename = GetArg('inputfilename',false);
	$InputLayout = GetArg('inputlayout',false);
	$SampleWidth = GetArg('samplewidth',4096);
	$SampleHeight = GetArg('sampleheight',4096);
	$SampleTime = GetArg('SampleTime',0);
	
	$OutputFilename = GetArg('outputfilename',false);		//	false = output to browser
	$OutputLayout = GetArg('outlayout',false);
	$OutputWidth = GetArg('Width',256);
	$OutputHeight = GetArg('Height',256);
	
	//	get params
	if ( IsCli() )
	{
		//	when being executed from command line the htaccess settings aren't used...
		//	ideally read this from htaccess.txt
		ini_set('memory_limit','1024M');
	}

	

	function CubemapToEquirect(&$CubeImage,$Cubemap)
	{
		//	make equirect image to fill
		$InWidth = imagesx( $CubeImage );
		$InHeight = imagesy( $CubeImage );
		$OutWidth = $Cubemap->GetImageWidth();
		$OutHeight = $Cubemap->GetImageHeight();
		
		$Cubemap->Resize($InWidth,$InHeight);
		
		$EquiImage = imagecreatetruecolor($OutWidth,$OutHeight);
		
		$MinSampleX = 9999;
		$MaxSampleX = -9999;
		$MinSampleY = 9999;
		$MaxSampleY = -9999;
		$MinLon = 9999;
		$MaxLon = -9999;
		$MinLat = 9999;
		$MaxLat = -9999;
		$MinViewY = 9999;
		$MaxViewY = -9999;
		$ViewVector = new Vector3(0,0,0);
		$LatLon = new Vector2(0,0);
		$SphereImagePos = new Vector2(0,0);
		
		$debugminmax = GetArg('debugsample',false);
		
		//	render each pixel
		for ( $y=0; $y<$OutHeight; $y++ )
		{
			for ( $x=0;	$x<$OutWidth; $x++ )
			{
				//	destination latlon
				$LatLon = GetLatLong( $x, $y, $OutWidth, $OutHeight );
				$CubeImagePos = $Cubemap->GetImageXYFromLatLon($LatLon);
				$Sample = ReadPixel_Clamped( $CubeImage, $CubeImagePos->x, $CubeImagePos->y );
				//$Sample = GetLatLonColour($$LatLon);
				//$Sample = GetImageVector2Colour($CubeImagePos,$CubeImage);
				imagesetpixel( $EquiImage, $x, $y, $Sample );
				
				
				//	saves ~2 secs
				if ( $debugminmax )
				{
					$SphereImagePos = $CubeImagePos;
					//$MinViewY = min( $MinViewY, $ViewVector->y );
					//$MaxViewY = max( $MaxViewY, $ViewVector->y );
					$MinLon = min( $MinLon, $LatLon->y );
					$MaxLon = max( $MaxLon, $LatLon->y );
					$MinLat = min( $MinLat, $LatLon->x );
					$MaxLat = max( $MaxLat, $LatLon->x );
					$MinSampleX = min( $MinSampleX, $SphereImagePos->x );
					$MaxSampleX = max( $MaxSampleX, $SphereImagePos->x );
					$MinSampleY = min( $MinSampleY, $SphereImagePos->y );
					$MaxSampleY = max( $MaxSampleY, $SphereImagePos->y );
				}
			}
		}
		if ( $debugminmax )
			OnError("MinSampleX=$MinSampleX; MaxSampleX=$MaxSampleX; MinSampleY=$MinSampleY; MaxSampleY=$MaxSampleY; MinLon=$MinLon; MaxLon=$MaxLon; MinLat=$MinLat; MaxLat=$MaxLat; MinViewY=$MinViewY; MaxViewY=$MaxViewY; ");

		$CubeImage = $EquiImage;
	}
	

	

	if ( $InputFilename === false )
		return OnError("No inputfilename specified");
	if ( $InputLayout === false )
		return OnError("No layout specified");
	if ( !file_exists($InputFilename) )
		return OnError("404 ($InputFilename)");
	
	//	try different formats
	$LoadFormats = GetFfmpegInputFormats();
	foreach ( $LoadFormats as $LoadFormat )
	{
		$Image = LoadImage( $InputFilename, $SampleWidth, $SampleHeight, $SampleTime, $LoadFormat, $Error );
		if ( $Image !== false )
			break;
	}
	if ( $Image === false )
		return OnError("Error reading file: $Error");
	
	if ( $InputLayout != false && $InputLayout != 'false' )
	{
		//	equirect to cubemap
		$Cubemap = new SoyCubemap( $InputLayout );
		$Cubemap->Resize( $OutputWidth, $OutputHeight );
		
		$start = microtime(true);
		CubemapToEquirect( $Image, $Cubemap );
		$time_elapsed_us = microtime(true) - $start;
		if ( GetArg('debugtimer',false) )
			OnError("CubemapToEquirect took $time_elapsed_us secs");
	}

	if ( $OutputFilename !== false )
	{
		$ext = substr( $OutputFilename, -3 );
		if ( $ext == 'png' )
			$Result = ImageToJpeg($Image,$OutputFilename);
		else if ( $ext == 'jpg' )
			$Result = ImageToJpeg($Image,$OutputFilename);
		else
			return OnError("Failed to create image: " + $ext );
		
		if ( !$Result )
			return OnError('failed to create image');
		exit(0);
	}
	
	//	output to browser
	$Png = ImageToPng($Image);
	if ( $Png === false )
		return OnError('failed to create image');

	header('Content-Type: image/png');
	echo $Png;
?>