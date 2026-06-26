package com.gma

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import java.util.Calendar

class UnlockReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_USER_PRESENT) return

        // Only trigger during morning window (4 AM – 4 PM)
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        if (hour < 4 || hour >= 16) return

        val launch = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(launch)
    }
}
