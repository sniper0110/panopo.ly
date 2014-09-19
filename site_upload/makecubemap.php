<?php
	$_GET['panoname'] = 'xxx';
	require('panopoly.php');
	require('cubemap.php');
	require('ffmpeg.php');

	//	limit to X min processing
	set_time_limit( 10*60 );

	function GetArgDefault($Name,$Default)
	{
		if ( array_key_exists( $Name, $_GET ) )
			return $_GET[$Name];
		return $Default;
	}

	$InputFilename = GetArgDefault('arg',false);
	$SampleWidth = 4096;
	$SampleHeight = 4096;
	$SampleTime = GetArgDefault('SampleTime',0);
	
	$OutputFilename = false;		//	false = output to browser
	$OutputLayout = GetArgDefault('cubemap','ULFRBD');
	$OutputTileWidth = 2;
	$OutputTileHeight = 3;
	$OutputWidth = GetArgDefault('Width',2048);
	$OutputHeight = GetArgDefault('Height',2048);
	
	//	get params
	if ( IsCli() )
	{
		$a = 1;
		$InputFilename = $argv[$a++];
		$SampleWidth = $argv[$a++];
		$SampleHeight = $argv[$a++];
		$SampleTime = $argv[$a++];

		$OutputFilename = $argv[$a++];
		$OutputLayout = $argv[$a++];
		$OutputTileWidth = $argv[$a++];
		$OutputTileHeight = $argv[$a++];
		$OutputWidth = $argv[$a++];
		$OutputHeight = $argv[$a++];
		
		if ( $argc != $a )
		{
			return OnError("Wrong number of args ($argc != $a)");
		}
	}

	

	function EquirectToCubemap(&$EquiImage,$Cubemap)
	{
		//	make cubemap image to fill
		$InWidth = imagesx( $EquiImage );
		$InHeight = imagesy( $EquiImage );
		$OutWidth = $Cubemap->GetImageWidth();
		$OutHeight = $Cubemap->GetImageHeight();

		$CubeImage = imagecreatetruecolor($OutWidth,$OutHeight);
		
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
		
		//	re-using class objects saves cpu time in massive loops
		$ViewVector = new Vector3(0,0,0);
		$LatLon = new Vector2(0,0);
		$SphereImagePos = new Vector2(0,0);
		
		$debugminmax = array_key_exists('debugsample',$_GET);
		
		//	go through each tile, convert pixel to lat long, then read
		foreach ( $Cubemap->mFaceMap as $Face => $FaceOffset )
		{
			$Colour = GetFaceColour( $Face );
			
			for ( $fy=0;	$fy<$Cubemap->mTileSize->y;	$fy++ )
			for ( $fx=0;	$fx<$Cubemap->mTileSize->x;	$fx++ )
			{
				$x = $fx + ($FaceOffset->x * $Cubemap->mTileSize->x);
				$y = $fy + ($FaceOffset->y * $Cubemap->mTileSize->y);
				
				$vx = $fx / $Cubemap->mTileSize->x;
				$vy = $fy / $Cubemap->mTileSize->y;
				
				if ( !$Cubemap->ScreenToWorld( $Face, $vx, $vy, $ViewVector ) )//	0.9s
				{
					$Colour = GetRgb( 255, 0, 255 );
				}
				else
				{
				//	$Colour = GetVector3Colour( $ViewVector );
					ViewToLatLon( $ViewVector, $LatLon );	//	 0.9s
					
				//	$Colour = GetLatLonColour( $LatLon );
					GetScreenFromLatLong( $LatLon->x, $LatLon->y, $InWidth, $InHeight, $SphereImagePos );	//	0.41

				//	$Colour = GetVector2Colour( $SphereImagePos );
					$Colour = ReadPixel_Clamped( $EquiImage, $SphereImagePos->x, $SphereImagePos->y, $InWidth, $InHeight );	//	 1.77
				
					//	saves ~2 secs
					if ( $debugminmax )
					{
						$MinViewY = min( $MinViewY, $ViewVector->y );
						$MaxViewY = max( $MaxViewY, $ViewVector->y );
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
				 
				imagesetpixel( $CubeImage, $x, $y, $Colour );
			}
		}
		
		if ( $debugminmax )
			OnError("MinSampleX=$MinSampleX; MaxSampleX=$MaxSampleX; MinSampleY=$MinSampleY; MaxSampleY=$MaxSampleY; MinLon=$MinLon; MaxLon=$MaxLon; MinLat=$MinLat; MaxLat=$MaxLat; MinViewY=$MinViewY; MaxViewY=$MaxViewY; ");
		
		$EquiImage = $CubeImage;
	}
	

	if ( !file_exists($InputFilename) )
	{
		if ( IsCli() )
			var_dump($argv);
		return OnError("404 ($InputFilename)");
	}

	$Image = LoadImage( $InputFilename, $SampleWidth, $SampleHeight, $SampleTime );
	if ( $Image === false )
		return OnError("Error reading file");

	if ( $OutputLayout != false && $OutputLayout != 'false' )
	{
		//	equirect to cubemap
		$Cubemap = new SoyCubemap( $OutputTileWidth, $OutputTileHeight, $OutputLayout );
		$Cubemap->Resize( $OutputWidth, $OutputHeight );
		
		$start = microtime(true);
		EquirectToCubemap( $Image, $Cubemap );
		$time_elapsed_us = microtime(true) - $start;
		if ( array_key_exists('debugtimer',$_GET) )
			OnError("EquirectToCubemap took $time_elapsed_us secs");
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