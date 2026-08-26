package com.jacksequeiramobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

class AppInfoModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AppInfo"

  override fun getConstants(): MutableMap<String, Any> = hashMapOf(
    "version" to BuildConfig.VERSION_NAME,
  )
}
