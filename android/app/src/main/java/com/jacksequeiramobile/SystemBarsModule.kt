package com.jacksequeiramobile

import android.graphics.Color
import android.os.Build
import android.view.View
import android.view.WindowInsetsController
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SystemBarsModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "SystemBars"

  @ReactMethod
  fun setNavigationBarColor(color: String, useDarkIcons: Boolean) {
    val activity = getCurrentActivity() ?: return

    activity.runOnUiThread {
      val window = activity.window
      window.navigationBarColor = Color.parseColor(color)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val appearance = if (useDarkIcons) {
          WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
        } else {
          0
        }
        window.insetsController?.setSystemBarsAppearance(
          appearance,
          WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
        )
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val decorView = window.decorView
        decorView.systemUiVisibility = if (useDarkIcons) {
          decorView.systemUiVisibility or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        } else {
          decorView.systemUiVisibility and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
        }
      }
    }
  }
}
