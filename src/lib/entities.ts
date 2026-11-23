/* every Home Assistant entity the app uses - when one is renamed in HA, update it here (mirrors the pwa) */
export const ENTITIES = {
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
