# R8 / ProGuard rules for TerraShield

# Keep Kotlinx Serialization models
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
    @kotlinx.serialization.Serializer <fields>;
}
-keep class com.terrasync.terrashield.domain.model.** { *; }
-keep class com.terrasync.terrashield.feature.admin.** { *; }
-keepclassmembers class **$serializer {
    public static final ** INSTANCE;
}

# Keep Compose Runtime Immutable & Stable annotations
-keep @interface androidx.compose.runtime.Immutable
-keep @interface androidx.compose.runtime.Stable

# Keep Android BuildConfigs
-keep class com.terrashield.app.BuildConfig { *; }
