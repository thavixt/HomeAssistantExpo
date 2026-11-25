/* every Home Assistant entity the app uses - when one is renamed in HA, update it here (mirrors the pwa) */
export const ENTITIES = {
  person: 'person.peter_komlosi',
  lights: {
    entrance: 'light.entrance_plug',
    livingRoom: 'light.living_room_light',
    bedside: 'light.bed_light',
    tvStand: 'switch.tv_lights_plug_1_aljzat',
    pcDesk: 'switch.xth_za101m_3_1_aljzat',
    stairs: 'switch.lava_lamp_plug_1_aljzat',
  },
  scenes: {
    vibes: 'scene.vibes',
    nightLights: 'scene.night_lights',
    lightsOff: 'scene.lights_off',
    sleepMode: 'scene.sleep_mode',
  },
  ac: {
    climate: 'climate.living_room_gree_ac_gree_9785',
    xFan: 'switch.living_room_gree_ac_automatikus_x_fan',
    beep: 'switch.living_room_gree_ac_csipogo',
  },
  tv: {
    mediaPlayer: 'media_player.living_room_vidaa_smart_tv',
    remote: 'remote.living_room_vidaa_smart_tv_remote',
  },
  helpers: {
    /* time-only input_datetime, the "Morning" automation's trigger */
    morningWakeTime: 'input_datetime.morning_wake_time',
  },
  /* mobile app sensors */
  phone: {
    /* the name of the Wi-Fi network the phone is on */
    wifi: 'sensor.sm_a566b_wi_fi_connection',
    nextAlarm: 'sensor.sm_a566b_next_alarm',
    batteryLevel: 'sensor.sm_a566b_battery_level',
    batteryState: 'sensor.sm_a566b_battery_state',
    tracker: 'device_tracker.sm_a566b',
  },
  dashboardTablet: {
    batteryLevel: 'sensor.lenovo_tb_x606x_tablet_battery_level',
    batteryState: 'sensor.lenovo_tb_x606x_tablet_battery_state',
    tracker: 'device_tracker.lenovo_tb_x606x_tablet',
  },
  dashboardPhone: {
    batteryLevel: 'sensor.sm_a236b_mobile_battery_level',
    batteryState: 'sensor.sm_a236b_mobile_battery_state',
    tracker: 'device_tracker.sm_a236b_mobile',
  },
  /* HASS.Agent and Tailscale sensors */
  laptop: {
    batteryLevel: 'sensor.msibravo_msibravo_battery_charge_remaining_percentage',
    powerlineStatus: 'sensor.msibravo_msibravo_battery_powerline_status',
    lastSeen: 'sensor.msibravo_utoljara_latva',
  },
  security: {
    /* shown in the Security card, in this order */
    camera: {
      /* MJPEG camera, streaming from the motionEye add-on */
      livingRoom: 'camera.camera_1',
    },
  },
  /* the Raspberry Pi running HA */
  system: {
    cpuTemperature: 'sensor.system_monitor_processzor_homerseklet',
    cpuUsage: 'sensor.system_monitor_processzor_hasznalat',
    memoryUsage: 'sensor.system_monitor_memoriahasznalat',
    uptime: 'sensor.system_monitor_uzemido',
  },
  automations: {
    homeEnter: 'automation.home_enter',
    homeLeaving: 'automation.home_leaving',
    turnOnTv: 'automation.turn_on_tv',
    homeMorningSetup: 'automation.home_morning_setup',
    homeAfternoonLights: 'automation.home_afternoon_lights',
    turnOffTvAtMidnight: 'automation.turn_off_tv_at_midnight',
    phoneSleepReminder: 'automation.phone_sleep_reminder',
    cpuTemperatureWarning: 'automation.raspberry_cpi_temperature_warning',
    dashboardsBatteryLow: 'automation.home_dashboards_battery_low',
    radioRefreshLiveVideoId: 'automation.radio_1_refresh_live_video_id',
    entranceLightAutoOff: 'automation.entrance_light_off_after_arriving',
  },
  scripts: {
    lofiStream: 'script.lofi',
    /* says a message out loud on the phone, at full volume */
    phoneSpeak: 'script.phone_speak',
    /* the same, on the dashboard tablet */
    dashboardTabletSpeak: 'script.dashboard_tablet_speak',
    /* turns the TV on if needed, then says the message - takes a `language` too */
    sayOnTv: 'script.say_on_tv',
    fireplaceStream: 'script.fireplace',
    playYoutubeVideo: 'script.play_youtube_video',
    dashboardBrowser: 'script.dashboard_browser',
    /* turn the TV and its lights on/off together */
    tvOn: 'script.tv_on',
    tvTurnOff: 'script.tv_turn_off',
  },
} as const;

/** "script.tv_on" -> "tv_on", e.g. to call a script as a service */
export const objectId = (entityId: string) => entityId.slice(entityId.indexOf('.') + 1);
