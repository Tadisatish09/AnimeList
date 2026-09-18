# Retrofit & Gson rules
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.anivault.app.data.model.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
