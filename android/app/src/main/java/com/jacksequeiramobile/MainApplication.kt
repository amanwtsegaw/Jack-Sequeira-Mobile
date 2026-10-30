package com.jacksequeiramobile

import android.app.Application
import android.graphics.Typeface
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(SystemBarsPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Register the actual faces so bold/italic text keeps the selected family.
    // Asset-name lookup alone expects *_bold.ttf and otherwise falls back to system fonts.
    val fonts = mapOf(
      "Cabin-Regular" to "Cabin-Regular.ttf",
      "Cabin_Condensed-Regular" to "Cabin_Condensed-Regular.ttf",
      "Lexend-Regular" to "Lexend-Regular.ttf",
      "Quicksand-Regular" to "Quicksand-Regular.ttf",
      "Raedex" to "Raedex.ttf",
      "Menbere-Regular" to "Menbere-Regular.ttf",
      "NokiaPureHeadline-Regular" to "NokiaPureHeadline-Regular.ttf",
    )
    fonts.forEach { (family, file) ->
      ReactFontManager.getInstance().addCustomFont(family, Typeface.createFromAsset(assets, "fonts/$file"))
    }
    loadReactNative(this)
  }
}
