package expo.modules.calloverlay

import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class CallOverlayModule : Module() {
  private fun ctx(): Context =
    appContext.reactContext?.applicationContext ?: throw IllegalStateException("No context")

  override fun definition() = ModuleDefinition {
    Name("CallOverlay")
    Function("canDrawOverlays") { Settings.canDrawOverlays(ctx()) }
    Function("isLocked") {
      (ctx().getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).isKeyguardLocked
    }
    Function("show") { o: Map<String, Any?> -> Overlay.show(ctx(), o) }
    Function("hide") { Overlay.hide() }
  }
}

object Overlay {
  private val main = Handler(Looper.getMainLooper())
  private var view: View? = null
  private var wm: WindowManager? = null
  private val timeout = Runnable { removeNow() }

  private fun dp(c: Context, v: Int) = (v * c.resources.displayMetrics.density).toInt()

  fun hide() { main.post { removeNow() } }

  private fun removeNow() {
    main.removeCallbacks(timeout)
    view?.let { try { wm?.removeView(it) } catch (_: Exception) {} }
    view = null
  }

  private fun initials(name: String): String =
    name.replace(Regex("^Counselor\\s+", RegexOption.IGNORE_CASE), "")
      .split(Regex("\\s+")).filter { it.isNotEmpty() }.take(2)
      .joinToString("") { it.first().uppercase() }.ifEmpty { "•" }

  private fun pill(c: Context, label: String, color: Int, onTap: () -> Unit) = TextView(c).apply {
    text = label
    setTextColor(Color.WHITE)
    textSize = 14f
    typeface = Typeface.DEFAULT_BOLD
    gravity = Gravity.CENTER
    background = GradientDrawable().apply { setColor(color); cornerRadius = dp(c, 22).toFloat() }
    layoutParams = LinearLayout.LayoutParams(0, dp(c, 44), 1f).apply {
      leftMargin = dp(c, 5); rightMargin = dp(c, 5)
    }
    setOnClickListener { onTap() }
  }

  private fun cancelNotifications(c: Context, channelId: String?) {
    if (channelId == null) return
    val nm = c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.activeNotifications
      .filter { it.notification.channelId == channelId }
      .forEach { nm.cancel(it.tag, it.id) }
  }

  private fun declineRemote(o: Map<String, Any?>) {
    val url = o["supabaseUrl"] as? String ?: return
    val anon = o["anonKey"] as? String ?: return
    val jwt = o["accessToken"] as? String ?: return
    val id = o["appointmentId"] as? String ?: return
    thread {
      try {
        val conn = URL("$url/rest/v1/rpc/respond_to_call").openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.connectTimeout = 8000
        conn.readTimeout = 8000
        conn.setRequestProperty("apikey", anon)
        conn.setRequestProperty("Authorization", "Bearer $jwt")
        conn.setRequestProperty("Content-Type", "application/json")
        conn.doOutput = true
        conn.outputStream.use {
          it.write("""{"p_appointment_id":"$id","p_response":"declined"}""".toByteArray())
        }
        conn.responseCode
        conn.disconnect()
      } catch (_: Exception) {}
    }
  }

  fun show(c: Context, o: Map<String, Any?>) {
    main.post {
      removeNow()
      val id = o["appointmentId"] as? String ?: return@post
      val name = o["name"] as? String ?: "Your counselor"
      val mode = o["mode"] as? String ?: "video"
      val type = o["type"] as? String ?: "Counseling"
      val scheme = o["scheme"] as? String ?: "nextstephub"
      val channelId = o["channelId"] as? String
      val timeoutMs = (o["timeoutMs"] as? Number)?.toLong() ?: 45000L

      val card = LinearLayout(c).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(c, 16), dp(c, 14), dp(c, 16), dp(c, 16))
        background = GradientDrawable().apply {
          setColor(Color.parseColor("#F2202327"))
          cornerRadius = dp(c, 22).toFloat()
          setStroke(dp(c, 1), Color.parseColor("#33FFFFFF"))
        }
        elevation = dp(c, 12).toFloat()
      }

      val header = LinearLayout(c).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
      val avatar = FrameLayout(c).apply {
        layoutParams = LinearLayout.LayoutParams(dp(c, 52), dp(c, 52))
        background = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.parseColor("#16A34A")) }
        addView(TextView(c).apply {
          text = initials(name); setTextColor(Color.WHITE); textSize = 18f
          typeface = Typeface.DEFAULT_BOLD; gravity = Gravity.CENTER
        }, FrameLayout.LayoutParams(-1, -1))
      }
      val texts = LinearLayout(c).apply {
        orientation = LinearLayout.VERTICAL
        layoutParams = LinearLayout.LayoutParams(0, -2, 1f).apply { leftMargin = dp(c, 12) }
        addView(TextView(c).apply {
          text = name; setTextColor(Color.WHITE); textSize = 18f
          typeface = Typeface.DEFAULT_BOLD; maxLines = 1
        })
        addView(TextView(c).apply {
          text = "Incoming $mode session · $type"
          setTextColor(Color.parseColor("#B3FFFFFF")); textSize = 13f; maxLines = 1
        })
      }
      header.addView(avatar); header.addView(texts)

      val buttons = LinearLayout(c).apply {
        orientation = LinearLayout.HORIZONTAL
        layoutParams = LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(c, 14) }
      }
      buttons.addView(pill(c, "ACCEPT", Color.parseColor("#16A34A")) {
        removeNow()
        cancelNotifications(c, channelId)
        val uri = Uri.parse("$scheme://").buildUpon()
          .appendQueryParameter("acceptCall", id)
          .appendQueryParameter("mode", mode)
          .appendQueryParameter("name", name)
          .appendQueryParameter("type", type)
          .build()
        c.startActivity(
          Intent(Intent.ACTION_VIEW, uri).setPackage(c.packageName)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        )
      })
      buttons.addView(pill(c, "DECLINE", Color.parseColor("#EF4444")) {
        removeNow()
        cancelNotifications(c, channelId)
        declineRemote(o)
      })
      card.addView(header); card.addView(buttons)

      val statusBar = c.resources.getIdentifier("status_bar_height", "dimen", "android")
        .let { if (it > 0) c.resources.getDimensionPixelSize(it) else dp(c, 24) }

      val lp = WindowManager.LayoutParams(
        c.resources.displayMetrics.widthPixels - dp(c, 24),
        WindowManager.LayoutParams.WRAP_CONTENT,
        if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        PixelFormat.TRANSLUCENT
      ).apply {
        gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
        y = statusBar + dp(c, 8)
      }

      wm = c.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      try {
        wm?.addView(card, lp)
        view = card
        main.postDelayed(timeout, timeoutMs)
      } catch (_: Exception) {}
    }
  }
}