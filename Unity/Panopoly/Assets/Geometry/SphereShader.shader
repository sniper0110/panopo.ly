Shader "Custom/SphereShader" {
	Properties {
		_MainTex ("Base (RGB)", 2D) = "white" {}
		PanoTop ("PanoTop", Float ) = 0.0
		PanoBottom ("PanoBottom", Float ) = 1.0
		PanoLeft ("PanoLeft", Float ) = 0.0
		PanoRight ("PanoRight", Float ) = 1.0
		
	}
	SubShader {
		Tags { "RenderType"="Opaque" }
		LOD 200
		Cull Front
		
		CGPROGRAM
		#pragma surface surf NoLighting

		sampler2D _MainTex;
		float PanoTop;
		float PanoBottom;
		float PanoLeft;
		float PanoRight;

		struct Input {
			float2 uv_MainTex;
		};

float GetTime(float Value,float Min,float Max)
	{
		return (Value-Min) / (Max-Min);
	}
	
		void surf (Input IN, inout SurfaceOutput o) {
			
			float2 uv = IN.uv_MainTex;
			float UvLeft = -PanoLeft;
			float UvRight = PanoRight;
			float UvTop = -PanoTop;
			float UvBottom = PanoBottom;
			
			//uv.x = (uv.x * (UvRight - UvLeft) );
			//uv.y = (uv.y * (UvBottom - UvTop) );
			
			//	panoleft -> 0
			//	panoright -> 1
			uv.x = GetTime( uv.x, PanoLeft, PanoRight );
			uv.y = GetTime( uv.y, 1.0-PanoBottom, 1.0-PanoTop );
			
			o.Albedo = tex2D (_MainTex, uv).rgb;
			if ( uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 )
			{
				o.Albedo = float4( 0.0, 0.0, 0.0, 0.0 );
				discard;
			}

			o.Alpha = 1.0;
		}
		
		fixed4 LightingNoLighting(SurfaceOutput s, fixed3 lightDir, fixed atten)
		{
			fixed4 c;
			c.rgb = s.Albedo; 
			c.a = s.Alpha;
			return c;
		}
     
		ENDCG
	} 
	FallBack "Diffuse"
}
