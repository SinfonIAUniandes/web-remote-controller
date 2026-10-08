# Panic Button

A one-tap emergency stop. It halts whatever the robot is doing and sends it back to its default position.

- **Component:** `src/components/PanicButton.tsx`
- **Shared signal:** `src/services/panic.ts`
- **Location:** `src/App.tsx`, under the side menu. The sticky positioning is on the wrapper around the menu and the button, so both stay visible when the page scrolls.
- **Shortcut:** `Esc` (works even when a text field is focused; key repeat is ignored)

All topic and service names below are from `ROBOT_TOOLKIT_API.md`.

## What happens when it is pressed

Steps run in this order, all in the same click:

| # | Action | How |
|---|--------|-----|
| 1 | Cancel running scripts, clear held keys, stop the hold-to-repeat timers | `triggerPanic()` dispatches the window event `robot:panic` (see below) |
| 2 | Stop the base | Publish a zero `Twist` on `/cmd_vel` 5 times, 50 ms apart (one message can be lost on a websocket) |
| 3 | Cut the audio | `stopSpeech(ros)` (`audio_tools_srv` `disable_tts` then `enable_tts`), plus `/pytoolkit/ALTextToSpeech/shut_up_srv` (`ALTextToSpeech.stopAll()`) and `/pytoolkit/ALAudioPlayer/stop_audio_stream_srv` (`ALAudioPlayer.stopAll()`). Both services take no arguments (type `robot_toolkit_msgs/battery_service_srv`) and are served by `py_toolkit` |
| 4 | Center the head | Publish `HeadPitch = 0`, `HeadYaw = 0` on `/set_angles` (`fraction_max_speed` 0.2) |
| 5 | Default posture | Call `/pytoolkit/ALRobotPosture/go_to_posture_srv` with `posture: 'stand'` (NAOqi `Stand`) |

The button is disabled (greyed out) when there is no ROS connection. After a press it shows "DETENIDO" for 2 seconds.

"Default position" is `stand`, not `rest`. In the toolkit, `rest` maps to NAOqi `Crouch`, a deliberate crouch the robot could fall into mid-motion.

The panic button relies on the features that `Movement` (navigation tools, for `/cmd_vel`) and `HeadMovement` (motion tools, for `/set_angles`) enable when they mount. Both stay mounted for the whole session (`App.tsx` only hides inactive tabs), so no extra setup is needed.

## The panic signal (`src/services/panic.ts`)

Components that run scripts or move the robot each keep their own private state, so the button cannot reach into them. Instead:

- `triggerPanic()` dispatches a `robot:panic` event on `window`.
- `usePanicListener(callback)` is a hook that registers a listener for that event.

Components that listen:

| Component | Reaction to panic |
|-----------|-------------------|
| `HotWords` | Aborts the running script (`abortRef`) |
| `ScriptsCreator` | Aborts the full script and any single-step execution |
| `QuickAction` | Aborts the running quick script |
| `Movement` | Drops all pressed keys and stops the 10 Hz `/cmd_vel` timer; ignores key-repeat events until the next fresh key press |
| `HeadMovement` | Same as Movement, and resets its internal pitch/yaw to 0 so the next head move starts from center |

### Hold-to-repeat and panic

`Movement` and `HeadMovement` keep re-sending their command every 100 ms while a button or key is held (the toolkit stops the base if `/cmd_vel` is silent for 0.5 s, so a single message only moves the robot for half a second). A panic must therefore also stop those timers, otherwise the next tick would start moving the robot again. That is what the listeners above do.

### Held keys

If a movement key (W/A/S/D/Q/E or I/J/K/L) is still held when panic is pressed, the browser keeps firing `keydown` events with `event.repeat === true`, which would restart the movement. After a panic, repeat events are ignored. A fresh key press (`repeat === false`) works normally again.

### Aborting a script

Aborting an `AbortController` stops the script from starting its next step. It does not undo a step that was already sent to the robot. That is why panic also goes to `stand` and tries to stop speech.

## Limitations

### Animations are not explicitly stopped

Animations are NAOqi behaviors. The toolkit starts them asynchronously with `ALBehaviorManager.startBehavior` when a message arrives on `/animations`, and **it exposes no way to stop one**. `/animations` only starts, and `motion_tools_srv` only enables or disables the ROS subscribers for `/animations` and `/set_angles`; it does not touch a behavior that is already running. (Disabling and re-enabling it would therefore not cancel a running animation, and it would also temporarily disable `/set_angles`, which the head recentering needs.)

What panic does for animations:

- It stops the **script** that would trigger the *next* animation, so no new animations start.
- It sends the robot to `stand` and recenters the head, **assuming** that this interrupts an animation in progress.

That assumption is not verified. Depending on how NAOqi handles `Stand` while a behavior is running, an animation that is already running may be interrupted cleanly, finish before the posture change takes effect, or fight with it. **This must be tested on the real robot** (for example, start a long dance from QuickAction, then press panic).

If it turns out animations are not interrupted, the options are, all untested:

- `pytoolkit/ALAutonomousLife/set_state_srv` with `data: false`. According to the toolkit it sets the autonomous life state to `disabled` and then goes to `Stand`, which may stop the running activity.
- `/special_settings` with `command: 'rest', state: true` (`ALMotion.rest()`). It stops motion for sure, but the robot goes limp, so it is closer to a hard stop than to "return to default position".
- Add a "stop all behaviors" call to the toolkit itself (`ALBehaviorManager.stopAllBehaviors`), since it is not exposed today.

### Audio cut: what is and is not verified

`disable_tts` / `enable_tts` only start and stop the `/speech` subscriber, so on their own they do not cut a sentence already in progress. That is why the panic button also calls `ALTextToSpeech/shut_up_srv` and `ALAudioPlayer/stop_audio_stream_srv`, which the toolkit documentation maps to `ALTextToSpeech.stopAll()` and `ALAudioPlayer.stopAll()`.

**Still to test on the robot:**

- Does `ALAudioPlayer.stopAll()` also cut the sound of an **animation** (a behavior's Play Sound box), or only files and streams started through `ALAudioPlayer`? Start a long animation with sound and press panic.
- Does `ALTextToSpeech.stopAll()` cut **animated speech** (`animated: true` uses `ALAnimatedSpeech`)?
- `ALMotion/play_dance_srv` blocks until the choreography ends and then stops audio itself; panic cannot interrupt the call, only its effects on the robot.

### The posture and audio-cut services are not part of the C++ toolkit

`go_to_posture_srv`, `shut_up_srv` and `stop_audio_stream_srv` are served by the separate Python node (`py_toolkit`, or the reduced `pyToolkit.py` copy, which the toolkit documentation marks as not tested). Whether it is running depends on how the robot is started. If it is not, steps 3 (the two service calls) and 5 do nothing (the calls fail and an error is logged to the console). The `/cmd_vel`, `disable_tts`/`enable_tts` and head steps do not depend on it.

### Other limitations

- **Posture while walking:** it is untested whether `stand` interrupts a base movement cleanly while the robot is walking. The zero `/cmd_vel` is sent first for that reason.
- **Watchdog as a safety net:** the toolkit stops the base by itself if no `/cmd_vel` arrives for 0.5 s. The panic button does not rely on this, but it also means a lost connection stops the base within half a second.
- **Not a hardware e-stop:** the button goes through the browser, the websocket and rosbridge. If the network or rosbridge is down, it cannot reach the robot (it is disabled in that case so it never looks like it worked). It does not replace the physical emergency stop.
- **Scripts started elsewhere:** only scripts run from this web interface are cancelled. Anything started from another client or from the robot itself is not affected, apart from the posture and `cmd_vel` commands.
