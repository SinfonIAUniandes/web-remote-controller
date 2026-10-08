# SinfonIA Robot Toolkit — Public Interface Reference

Packages: `robot_toolkit` (C++, catkin, this repository), `py_toolkit` (Python 2.7 node `pytoolkit`, sibling repository `../py_toolkit`; a reduced copy is in `scripts/pyToolkit.py`) and the message package `robot_toolkit_msgs` (`../robot_toolkit_msgs`)
Robot: SoftBank Pepper (NAOqi / libqi)
Middleware: **ROS 1** (`roscpp`, `rospy`, `catkin`; docs target Kinetic/Melodic/Noetic). There is no ROS 2 code in this repository.

> **How this document was produced.** Every entry below was derived from the source in this repository (file and line references are given), from the sibling package `py_toolkit` (`../py_toolkit/src/py_toolkit.py`, read in full for Section 8) and from the message/service definitions in `robot_toolkit_msgs` (`../robot_toolkit_msgs/msg/*.msg`, `srv/*.srv`), which supplies every field name, type and range comment quoted here. Section 7 reproduces those definitions.

---

## Table of contents

1. [Architecture and what is *not* in this API](#1-architecture-and-what-is-not-in-this-api)
2. [Starting the node (command-line options, "parameters")](#2-starting-the-node)
3. [Feature switches: what must be enabled before anything works](#3-feature-switches)
4. [Services](#4-services)
5. [Topics published](#5-topics-published)
6. [Topics subscribed](#6-topics-subscribed)
7. [Custom interfaces (`robot_toolkit_msgs`)](#7-custom-interfaces)
8. [Python node `pytoolkit`](#8-python-node-pytoolkit)
9. [External NAOqi dependencies](#9-external-naoqi-dependencies)
10. [Resources, launch files and deployment scripts](#10-resources-launch-files-and-scripts)
11. [Known quirks and bugs found in the code](#11-known-quirks-and-bugs)
12. [roslibjs usage (v2.1.0+)](#12-roslibjs-usage)

---

## 1. Architecture and what is not in this API

`robot_toolkit_node` runs on the robot, connects to NAOqi through a `qi::Session`, and bridges NAOqi data to ROS 1. It is built from three kinds of components (see [robot_toolkit.cpp:232-376](src/robot_toolkit.cpp)):

| Component | Role | Enabled by |
|---|---|---|
| **Converter + Publisher** | Polls NAOqi at a frequency and publishes a ROS topic | `scheduleConverter(name, Hz)` via a service |
| **Event** | Subscribes to a NAOqi `ALMemory` event and publishes when it fires | `startProcess()` via a service |
| **Subscriber** | Listens to a ROS topic and calls NAOqi | `startSubscriber(name)` via a service |

**Not present in this repository (confirmed by search):**

| Item | Result |
|---|---|
| ROS **actions** (`.action`, `actionlib`) | None. There is no `ROSLIB.ActionClient` target. Long-running behaviour is exposed as topics (`/navigation/goal` + `/navigation/result`) and one blocking service (`speech_recognition_srv`). |
| ROS **parameters** (`ros::param`, `getParam`, `rosparam`) | None. Configuration is by command-line options (section 2) and by the `custom` commands of the services. `rosparam get/set` has no effect on this node. |
| Custom `.msg` / `.srv` / `.action` files | None in this repo. They live in the external package `robot_toolkit_msgs` (a dependency in [package.xml](package.xml) and [CMakeLists.txt](CMakeLists.txt)). |

### Naming rules that affect every example

* **Services** are advertised with absolute names (`/robot_toolkit/...`, [robot_toolkit.cpp:489-494](src/robot_toolkit.cpp)).
* Almost all **topics** use absolute names (`/cmd_vel`, `/tf`, ...). The three **camera** topics are *relative* (`camera/front/image_raw`, ...) and the node handle is private (`~`), so they resolve under the node name: `/<node_name>/camera/front/image_raw`. The node name is the value of `--namespace` (default `robot_toolkit_node`), because `ros::init` is called with that name ([ros_environment.hpp:96](include/robot_toolkit/ros_environment.hpp)). Verify with `rostopic list | grep camera`.
* **Converter-based topics only publish while at least one subscriber is connected** ([robot_toolkit.cpp:91](src/robot_toolkit.cpp)). Event-based topics (`/touch`, `/audio_localization`, `/navigation/result`) publish whenever the event fires.

---

## 2. Starting the node

The node is a normal executable (`robot_toolkit_node`, [main.cpp](src/main.cpp)). Its command-line options are the closest thing this package has to parameters.

| Option | Type | Default | Description |
|---|---|---|---|
| `-h`, `--help` | flag | — | Print help and exit. |
| `-r`, `--roscore_ip` | string | *(none)* | IP of the ROS master. If omitted, ROS is **not** started; see note below. Master URI becomes `http://<ip>:11311`. |
| `-i`, `--network_interface` | string | `eth0` | Interface whose first IPv4 address is used as `__ip`. Exits with an error listing valid interfaces if not found ([ros_environment.hpp:45-65](include/robot_toolkit/ros_environment.hpp)). |
| `-n`, `--namespace` | string | `robot_toolkit_node` | Used as the ROS **node name** (and the prefix for relative topic names). Must not be empty. |
| `-o`, `--publish_odom` | bool | *(unset = false)* | `true`: publish wheel odometry as `/odom` **and** publish the `odom -> base_link` TF. `false`: publish it as `/odom_wheels` and omit that TF ([robot_toolkit.cpp:239-248](src/robot_toolkit.cpp), [tf_converter.cpp:266](src/navigation_tools/tf/tf_converter.cpp)). |
| `--qi-url` | string | — | libqi option, e.g. `tcp://<nao_ip>:9559` (used by the launch files). |

Launch files ([launch/](launch/)): `robot_toolkit_{eth,wlan}_{odom,no_odom}.launch`. Arguments: `nao_ip` (env `NAO_IP`), `nao_port` (env `NAO_PORT`, default `9559`), `roscore_ip` (default `127.0.0.1`), `network_interface` (`eth0` or `wlan0`). The `namespace` argument is declared in each launch file but is **not** forwarded to the node.

```bash
# On the robot (after sourcing ROS):
roslaunch robot_toolkit robot_toolkit_eth_odom.launch nao_ip:=127.0.0.1 roscore_ip:=192.168.0.10

# Or directly:
rosrun robot_toolkit robot_toolkit_node --qi-url=tcp://127.0.0.1:9559 \
    --roscore_ip=192.168.0.10 --network_interface=eth0 --publish_odom true
```

**NAOqi service `robot_toolkit`** (registered in `main.cpp:78` and `QI_REGISTER_OBJECT`, [robot_toolkit.cpp:1500](src/robot_toolkit.cpp)) exposes three `qicli` methods: `_whoWillWin()`, `setMasterURINet(uri, networkInterface)` and `startPublishing()`.

> Note: when `--roscore_ip` is omitted, only `init()` runs. `startRosLoop()` (the thread that publishes converters) is called only from `startInitialTopics()`, which `main()` calls only in the `--roscore_ip` path. Starting later with `qicli call robot_toolkit.setMasterURINet ...` advertises the services but does not start the publishing loop.

---

## 3. Feature switches

At startup **only the `/special_settings` subscriber is active** ([robot_toolkit.cpp:172-187](src/robot_toolkit.cpp)). Everything else must be switched on through one of the six services:

| To use ... | Enable with |
|---|---|
| `/tf`, `/odom`, `/laser`, `/depth_to_laser`, `/merged_laser`, `/cmd_vel`, `/move_base_simple/goal`, `/navigation/*`, `/free_zone` | `navigation_tools_srv` |
| Cameras, face detection | `vision_tools_srv` |
| `/mic`, `/audio_localization`, `/speech` | `audio_tools_srv` |
| `/animations`, `/set_angles` | `motion_tools_srv` |
| `/leds`, `/sonar/*`, `/touch` | `misc_tools_srv` |

Default frequencies used by the shortcut commands: `tf` 50 Hz, `odom` 10, `laser` 10, `depth_to_laser` 10, `merged_laser` 10, `navigation_path` 10, `navigation_robot_pose` 10, `sonar` 50, cameras 10, face detectors 30.

---

## 4. Services

All six services are in the `robot_toolkit_msgs` package. The five `*_tools_srv` services take a single field `data` holding the matching `*_msg`, so a call looks like `{data: {command: '...', ...}}`; `speech_recognition_srv` takes `words` and `threshold` directly. Responses always contain `result` (string); some add a parameters message. Unknown commands do **not** raise a ROS error: the service returns normally with `result` starting with `ERROR:`.

### 4.1 `/robot_toolkit/navigation_tools_srv` — `robot_toolkit_msgs/navigation_tools_srv`

[robot_toolkit.cpp:497-810](src/robot_toolkit.cpp)

**Request `data` (`navigation_tools_msg`)** — only `command` is needed for the shortcut commands.

| Field | Type | Used by | Meaning |
|---|---|---|---|
| `command` | string | all | `enable_mapper`, `disable_mapper`, `enable_navigate`, `disable_navigate`, `enable_all`, `disable_all`, `custom` |
| `tf_enable` | bool | custom | Publish `/tf` |
| `tf_frequency` | float32 (Hz) | custom | `/tf` rate |
| `odom_enable` | bool | custom | Publish odometry |
| `odom_frequency` | float32 (Hz) | custom | Odometry rate |
| `laser_enable` | bool | custom | Publish `/laser` |
| `laser_frequency` | float32 (Hz) | custom | Laser rate |
| `goal_enable` | bool | custom | Enable `/navigation/goal` subscriber |
| `robot_pose_suscriber_enable` | bool | custom | Enable `/navigation/robot_pose_subscriber`. **Spelled "suscriber"** in the message |
| `path_enable` | bool | custom | Publish `/navigation/path` |
| `path_frequency` | float32 (Hz) | custom | Path rate |
| `robot_pose_publisher_enable` | bool | custom | Publish `/navigation/robot_pose_publisher` |
| `robot_pose_publisher_frequency` | float32 (Hz) | custom | Pose rate |
| `result_enable` | bool | custom | Publish `/navigation/result` |
| `depth_to_laser_enable` | bool | custom | Publish `/depth_to_laser` at a fixed 10 Hz |
| `depth_to_laser_parameters` | `depth_to_laser_msg` | custom | `resolution` (uint8), `scan_time`, `range_min`, `range_max`, `scan_height` (float32) (see note) |
| `cmd_vel_enable` | bool | custom | Enable `/cmd_vel` subscriber |
| `security_timer` | float32 (s) | custom | `/cmd_vel` watchdog; `-1` (or any value `<= 0`) disables. **Truncated to an integer by the toolkit** (section 11) |
| `move_base_enable` | bool | custom | Enable `/move_base_simple/goal` subscriber |
| `free_zone_enable` | bool | custom | Enable `/free_zone` subscriber |

**Commands**

| `command` | Effect |
|---|---|
| `enable_mapper` | `/tf`@50, `/laser`@10, `/depth_to_laser`@10, `/odom`@10, `/merged_laser`@10; starts `/cmd_vel` |
| `disable_mapper` | Stops the five converters and `/cmd_vel` |
| `enable_navigate` | Starts `/navigation/goal`, `/navigation/robot_pose_subscriber`, `/free_zone`, `/navigation/result`; schedules `/navigation/path`@10 and `/navigation/robot_pose_publisher`@10. Does **not** schedule `/depth_to_laser` (despite its response text) |
| `disable_navigate` | Stops the above |
| `enable_all` | `/tf`@50, `/odom`@10, `/laser`@10, `/depth_to_laser`@10, navigation subscribers, `/navigation/result`, `/navigation/path`@10, `/navigation/robot_pose_publisher`@10, `/cmd_vel` (security timer reset to 0.5 s), `/move_base_simple/goal`. Does **not** start `/merged_laser` |
| `disable_all` | Stops all of the above |
| `custom` | Applies every field above; each `*_enable=false` stops that feature |

> `depth_to_laser_parameters` is read, but the converter actually registered for `/depth_to_laser` (`NaoqiDepth2LaserConverter`) ignores `setConfig`/`setParameters`, so these values have no effect ([naoqi_depth2laser_converter.hpp:48-66](include/robot_toolkit/navigation_tools/laser/naoqi_depth2laser_converter.hpp)).

**Response** — `result` (string): a human-readable summary such as `"Functionalities started: ..."`, or `"ERROR: unkown command in navigation_tools service"`.

```bash
rosservice call /robot_toolkit/navigation_tools_srv "data: {command: 'enable_all'}"

rosservice call /robot_toolkit/navigation_tools_srv "data:
  command: 'custom'
  tf_enable: true
  tf_frequency: 50.0
  odom_enable: true
  odom_frequency: 10.0
  cmd_vel_enable: true
  security_timer: 1"
```

### 4.2 `/robot_toolkit/vision_tools_srv` — `robot_toolkit_msgs/vision_tools_srv`

[robot_toolkit.cpp:812-1004](src/robot_toolkit.cpp)

**Request `data` (`vision_tools_msg`)**

| Field | Type | Meaning |
|---|---|---|
| `camera_name` | string | `front_camera`, `bottom_camera`, `depth_camera`, `front_camera_face_detector`, `bottom_camera_face_detector`. Anything else returns `ERROR: unknown camera name...` |
| `command` | string | `enable`, `disable`, `custom`, `set_parameters`, `get_parameters` |
| `resolution` | uint8 | `custom` only; see resolution table |
| `frame_rate` | uint8 | `custom` only |
| `color_space` | uint8 | `custom` only; see colour-space table |
| `camera_parameters` | `camera_parameters_msg` | `set_parameters` only |

**Commands**

| `command` | Behaviour |
|---|---|
| `enable` | Subscribes to the camera with defaults: resolution `1` (320x240), colour space RGB (`11`; raw depth `23` for the depth camera), **10 Hz** (face detectors: resolution `2` = 640x480, **30 Hz**). Resets camera parameters to NAOqi defaults (not for depth). |
| `disable` | Stops the converter (face detectors also unregister their NAOqi event). |
| `custom` | Validates then starts with your settings (rules below). |
| `set_parameters` | Applies `camera_parameters`; not available for `depth_camera`. |
| `get_parameters` | Returns current parameters; not available for `depth_camera`. |

**Validation for `custom`**

| Camera | `resolution` | `frame_rate` | `color_space` |
|---|---|---|---|
| RGB cameras and face detectors | `0..4`, `7` or `8` | `1..30`; must be exactly `1` when resolution is `3` (1280x960) or `4` (2560x1920) | `0..16` |
| `depth_camera` | `0`, `1`, `7` or `8` | `1..20` | one of `0`, `11`, `17`, `19`, `21`, `23` |

Errors return `result` = `ERROR: Bad resolution/frame rate/color space configuration for camera: <name>` and nothing is started.

**Resolution values** ([vision_helpers.hpp:62-72](include/robot_toolkit/helpers/vision_helpers.hpp))

| Value | Name | Size |
|---|---|---|
| 0 | kQQVGA | 160x120 |
| 1 | kQVGA | 320x240 |
| 2 | kVGA | 640x480 |
| 3 | k4VGA | 1280x960 |
| 4 | k16VGA | 2560x1920 |
| 5 / 6 | k720p / k1080p | 1280x720 / 1920x1080 (rejected by `custom`) |
| 7 | kQQQVGA | 80x60 |
| 8 | kQQQQVGA | 40x30 |

Calibration data exists only for the sizes in `share/camera_info/*.json` (RGB: kVGA, kQVGA, kQQVGA, kQQQVGA, kQQQQVGA, k4VGA, k16VGA; depth: kQVGA, kQQVGA, kQQQVGA, kQQQQVGA). The bottom camera has no calibration for kVGA/k4VGA/k16VGA in code; `camera_info` is empty then.

**Colour-space values** ([vision_helpers.hpp:74-97](include/robot_toolkit/helpers/vision_helpers.hpp)) and the ROS image they produce ([camera_converter.cpp:353-379](src/vision_tools/camera_converter.cpp)):

| Value(s) | NAOqi name | `Image.encoding` |
|---|---|---|
| 0-8 | Yuv, yUv, yuV, Rgb, rGb, rgB, Hsy, hSy, hsY (single channel) | `mono8` |
| 9, 14 | YUV422, YYCbCr | `mono16` |
| 17, 21, 23 | Depth, Distance, RawDepth | `16UC1` |
| 19 | XYZ | `rgb8` (data is 32-bit float, 3 channels) |
| 10-13, 15, 16, others | YUV, RGB, HSY, BGR, H2RGB, HSMixed | `rgb8` |

**`camera_parameters_msg` fields** (all 21 are read/written in this order, [robot_toolkit.cpp:1018-1073](src/robot_toolkit.cpp)):

| Field | NAOqi parameter | Notes |
|---|---|---|
| `brightness`, `contrast`, `saturation`, `hue` | Brightness, Contrast, Saturation, Hue | |
| `horizontal_flip`, `vertical_flip` | HFlip, VFlip | |
| `auto_exposition`, `auto_white_balance`, `auto_gain` | AutoExposition, AutoWhiteBalance, AutoGain | |
| `gain` | Gain | Applied only when `auto_gain` is 0 |
| `exposure` | Exposure | Applied only when `auto_exposition` is 0 |
| `reset_camera_registers` | SetDefaultParams | |
| `blc_red_value`, `blc_green_value`, `blc_blue_value` | BlcRed, BlcGb, BlcBlue | Read-only (ignored on set) |
| `resolution`, `fps`, `average_luminance` | Resolution, FrameRate, AverageLuminance | Read-only (ignored on set) |
| `auto_focus` | AutoFocus | |
| `compress` | — | `true`: image `data` becomes a JPEG and `encoding` becomes `compressed bgr8` (a non-standard use of `sensor_msgs/Image`, [camera_converter.cpp:177-229](src/vision_tools/camera_converter.cpp)) |
| `compression_factor` | — | JPEG quality, default 97 |

Types and documented ranges from `camera_parameters_msg`: `brightness` uint8 [0,255]; `contrast` uint8 [0,127]; `saturation` uint8 [0,255]; `hue` int16 [-180,180]; `horizontal_flip`, `vertical_flip`, `auto_exposition`, `auto_white_balance`, `auto_gain`, `reset_camera_registers`, `auto_focus`, `compress` bool; `gain` uint16 [0,1024]; `exposure` uint16 [0,65536]; `blc_*_value` uint16 [0,4096]; `resolution` uint8 [0,8]; `fps` uint8 [0,30]; `average_luminance` uint8 [0,255]; `compression_factor` uint8 [0,100]. Stated defaults: contrast 32, saturation 64, auto_exposition / auto_white_balance / auto_gain / auto_focus on, exposure 64, resolution 1, compression off (factor 97).

**Response**: `result` (string) and `camera_parameters` (`camera_parameters_msg`; populated by `enable`/`custom`/`set_parameters`/`get_parameters` for non-depth cameras, otherwise zero-initialised).

```bash
rosservice call /robot_toolkit/vision_tools_srv "data: {camera_name: 'front_camera', command: 'enable'}"
rosservice call /robot_toolkit/vision_tools_srv "data: {camera_name: 'front_camera', command: 'custom', resolution: 2, frame_rate: 15, color_space: 11}"
rosservice call /robot_toolkit/vision_tools_srv "data: {camera_name: 'front_camera_face_detector', command: 'enable'}"
rosservice call /robot_toolkit/vision_tools_srv "data: {camera_name: 'front_camera', command: 'get_parameters'}"
rosservice call /robot_toolkit/vision_tools_srv "data: {camera_name: 'depth_camera', command: 'disable'}"
```

### 4.3 `/robot_toolkit/audio_tools_srv` — `robot_toolkit_msgs/audio_tools_srv`

[robot_toolkit.cpp:1080-1222](src/robot_toolkit.cpp)

**Request `data` (`audio_tools_msg`)**

| Field | Type | Meaning |
|---|---|---|
| `command` | string | See table |
| `frequency` | uint16 | `custom`: mic sample rate, **48000 or 16000** |
| `channels` | uint8 | `custom`: `0` = all channels, `1` = left, `2` = right, `3` = front, `4` = rear (per the message comment); forwarded to NAOqi `ALAudioDevice.setClientPreferences` (default 0) |
| `speech_parameters` | `speech_parameters_msg` | `set_speech_params` only |

| `command` | Effect |
|---|---|
| `enable` | mic stream (defaults 48000 Hz, channels 0) + TTS + audio localization |
| `disable` | stops all three |
| `enable_mic` / `disable_mic` | `/mic` stream |
| `enable_tts` / `disable_tts` | `/speech` subscriber; response carries current speech parameters |
| `enable_localization` / `disable_localization` | `/audio_localization` |
| `custom` | restarts the mic stream with `frequency`/`channels`; invalid values return `ERROR: invalid mic parameters` |
| `get_speech_params` | returns current TTS parameters |
| `set_speech_params` | validates then applies `speech_parameters` |
| `reset_speech_params` | language-dependent defaults (English: pitch 1.17, speed 100; otherwise the Spanish set: pitch 1.25, speed 90; double voice off in both) |

**`speech_parameters_msg`**

| Field | NAOqi parameter | Valid range for `set_speech_params` |
|---|---|---|
| `pitch_shift` | pitchShift | `0` (off) or `1.0 .. 4.0` |
| `double_voice` | doubleVoice | `0` (off) or `1.0 .. 4.0` |
| `double_voice_level` | doubleVoiceLevel | `0.0 .. 4.0` |
| `double_voice_time_shift` | doubleVoiceTimeShift | `0.0 .. 0.5` |
| `speed` | speed | `50 .. 400` |

Out-of-range values return `result` = `ERROR: invalid speech parameters`. Any unrecognised command returns `ERROR: unknown command...`.

**Response**: `result` (string), `speech_parameters` (`speech_parameters_msg`).

```bash
rosservice call /robot_toolkit/audio_tools_srv "data: {command: 'enable_tts'}"
rosservice call /robot_toolkit/audio_tools_srv "data: {command: 'custom', frequency: 16000, channels: 0}"
rosservice call /robot_toolkit/audio_tools_srv "data:
  command: 'set_speech_params'
  speech_parameters: {pitch_shift: 1.2, double_voice: 0.0, double_voice_level: 0.0, double_voice_time_shift: 0.0, speed: 100.0}"
```

### 4.4 `/robot_toolkit/motion_tools_srv` — `robot_toolkit_msgs/motion_tools_srv`

[robot_toolkit.cpp:1224-1291](src/robot_toolkit.cpp)

| Request field `data.` | Type | Values |
|---|---|---|
| `command` | string | `enable_all`, `disable_all`, `custom` |
| `animation` | string | `custom`: `enable` or `disable` |
| `set_angles` | string | `custom`: `enable` or `disable` |

`enable_all` starts `/animations` and `/set_angles`; `disable_all` stops them. Response `result` (string). For `enable_all` the returned text is `"Functionalities started: Functionalities stopped:"` (it is overwritten by the shared summary line); the subscribers are still started.

```bash
rosservice call /robot_toolkit/motion_tools_srv "data: {command: 'enable_all'}"
rosservice call /robot_toolkit/motion_tools_srv "data: {command: 'custom', animation: 'enable', set_angles: 'disable'}"
```

### 4.5 `/robot_toolkit/misc_tools_srv` — `robot_toolkit_msgs/misc_tools_srv`

[robot_toolkit.cpp:1333-1421](src/robot_toolkit.cpp)

| Request field `data.` | Type | Values |
|---|---|---|
| `command` | string | `enable_all`, `disable_all`, `custom` (`touch` is also accepted but does nothing) |
| `leds` | string | `custom`: `enable`/`disable` -> `/leds` subscriber |
| `sonars` | string | `custom`: `enable`/`disable` -> `/sonar/front`, `/sonar/back` at 50 Hz |
| `touch` | string | `custom`: `enable`/`disable` -> `/touch` |

Response `result` (string). As with motion tools, the `enable_all` summary text is empty even though the features start.

```bash
rosservice call /robot_toolkit/misc_tools_srv "data: {command: 'enable_all'}"
rosservice call /robot_toolkit/misc_tools_srv "data: {command: 'custom', leds: 'enable', sonars: 'enable', touch: 'disable'}"
```

### 4.6 `/robot_toolkit/speech_recognition_srv` — `robot_toolkit_msgs/speech_recognition_srv`

[robot_toolkit.cpp:1319-1331](src/robot_toolkit.cpp), [speech_recognition_event.cpp](src/audio_tools/speech_recognition/speech_recognition_event.cpp)

| Direction | Field | Type | Meaning |
|---|---|---|---|
| Request | `words` | string[] | Vocabulary for NAOqi `ALSpeechRecognition` |
| Request | `threshold` | float | Minimum confidence to accept (NAOqi confidences are `0..1`) |
| Response | `result` | string | Recognised word, or `NONE` if the best confidence was `<= threshold` |

Behaviour: **blocks** until the next `WordRecognized` event (polls every 0.5 s), with **no timeout and no cancel**. Language is hard-coded to English. Speech recognition is paused during setup, then un-paused and unsubscribed afterwards. Give the client a generous timeout; avoid concurrent calls (a second call while one is waiting returns the previous word immediately).

```bash
rosservice call /robot_toolkit/speech_recognition_srv "{words: ['yes', 'no', 'maybe'], threshold: 0.4}"
```

---

## 5. Topics published

Frequencies are those used by the shortcut commands; `custom` can change them where noted. Frames are as set in the code.

| Topic | Type | Source / rate | Enabled by |
|---|---|---|---|
| `/tf` | `tf2_msgs/TFMessage` | converter, 50 Hz | navigation `tf_enable` |
| `/odom` or `/odom_wheels` | `nav_msgs/Odometry` | converter, 10 Hz | navigation `odom_enable` |
| `/laser` | `sensor_msgs/LaserScan` | converter, 10 Hz | navigation `laser_enable` |
| `/merged_laser` | `sensor_msgs/LaserScan` | converter, 10 Hz | `enable_mapper` only |
| `/depth_to_laser` | `sensor_msgs/LaserScan` | converter, 10 Hz | navigation `depth_to_laser_enable` |
| `<node>/camera/front/image_raw` (+ `camera_info`) | `sensor_msgs/Image` | 10 Hz (configurable) | vision `front_camera` |
| `<node>/camera/bottom/image_raw` (+ `camera_info`) | `sensor_msgs/Image` | 10 Hz (configurable) | vision `bottom_camera` |
| `<node>/camera/depth/image_raw` (+ `camera_info`) | `sensor_msgs/Image` | 10 Hz (configurable) | vision `depth_camera` |
| `/face_publisher/front_camera` | `robot_toolkit_msgs/face_detection_msg` | event, 30 Hz poll | vision `front_camera_face_detector` |
| `/face_publisher/bottom_camera` | `robot_toolkit_msgs/face_detection_msg` | event, 30 Hz poll | vision `bottom_camera_face_detector` |
| `/mic` | `naoqi_bridge_msgs/AudioBuffer` | event | audio `enable_mic` |
| `/audio_localization` | `robot_toolkit_msgs/audio_localization_msg` | event | audio `enable_localization` |
| `/sonar/front`, `/sonar/back` | `sensor_msgs/Range` | converter, 50 Hz | misc `sonars` |
| `/touch` | `robot_toolkit_msgs/touch_msg` | event | misc `touch` |
| `/navigation/path` | `robot_toolkit_msgs/path_msg` | converter, 10 Hz | navigation `path_enable` |
| `/navigation/robot_pose_publisher` | `geometry_msgs/Vector3` | converter, 10 Hz | navigation `robot_pose_publisher_enable` |
| `/navigation/result` | `std_msgs/String` | event | navigation `result_enable` |
| `/free_zone/result` | `geometry_msgs/Pose2D` | one message per `/free_zone` request | navigation `free_zone_enable` |

### `/tf` — `tf2_msgs/TFMessage`

Only these transforms are published ([tf_converter.cpp:45-52,193-275](src/navigation_tools/tf/tf_converter.cpp)): child frames `Neck`, `Head`, `CameraBottom_frame`, `CameraBottom_optical_frame`, `CameraTop_frame`, `CameraTop_optical_frame`, `CameraDepth_frame`, `CameraDepth_optical_frame` (from `share/urdf/pepper.urdf` and live joint angles), plus `base_link -> torso` always, plus `odom -> base_link` **only when `--publish_odom true`**. Every other URDF frame is used internally (for `/move_base_simple/goal`) but not published; publish the URDF to `robot_state_publisher` if you need the full tree.

### `/odom` or `/odom_wheels` — `nav_msgs/Odometry`

`header.frame_id = odom`, `child_frame_id = base_link`. Pose from `ALMotion.getPosition("Torso", FRAME_WORLD, useSensors)`; `twist.linear.x/y` and `twist.angular.z` from `ALMotion.getRobotVelocity` (m/s, rad/s); other twist components are 0 ([odom_converter.cpp:54-95](src/navigation_tools/odom/odom_converter.cpp)). Topic name is `/odom` only when `--publish_odom true`.

### `/laser` — `sensor_msgs/LaserScan`

Built from Pepper's three 15-segment lasers (right, front, left) ([laser_converter.cpp:149-208](src/navigation_tools/laser/laser_converter.cpp)).

| Field | Value |
|---|---|
| `header.frame_id` | `base_link` |
| `angle_min` / `angle_max` | -2.0944 / +2.0944 rad (+-120 deg) |
| `angle_increment` | `2*2.0944 / 61` rad |
| `range_min` / `range_max` | 0.1 / 1.5 m |
| `ranges` | 61 values (m). The 8-beam gaps between the three lasers stay at `-1.0` |

### `/merged_laser` — `sensor_msgs/LaserScan`

Fuses the three lasers with the external `NAOqiDepth2Laser` module ([laser_merged_converter.cpp:149-327](src/navigation_tools/laser/laser_merged_converter.cpp)). `frame_id = base_footprint`, `angle_min/max = -+2.0944`, **512** beams (`angle_increment = 2*2.0944/512`), `range_min = 0.1`, `range_max` = `NAOqiDepth2Laser/MaxRange`, `scan_time = 0.01`. Beams with no data are `80.0`; uncovered gap beams are `-1.0`; laser readings above 1.0 m are replaced with `80.0`.

### `/depth_to_laser` — `sensor_msgs/LaserScan`

Copied from the NAOqi memory keys `NAOqiDepth2Laser/{Ranges,MinAngle,MaxAngle,NumRanges,MaxRange}` ([naoqi_depth2laser_converter.cpp](src/navigation_tools/laser/naoqi_depth2laser_converter.cpp)). `frame_id = base_footprint`, `range_min = 0.1`, `scan_time = 0.01`, `angle_increment = (max-min)/NumRanges`. Requires the external `NAOqiDepth2Laser` module; if it is missing the message is published with empty ranges and a warning is printed. (The older OpenCV-based `DepthToLaserConverter` is compiled but not registered.)

### Camera topics — `sensor_msgs/Image` + `sensor_msgs/CameraInfo`

Published with `image_transport::advertiseCamera`, so `camera_info` is published next to each image topic and any installed image_transport plugins add their own sub-topics. `frame_id`: `CameraTop_optical_frame`, `CameraBottom_optical_frame`, `CameraDepth_optical_frame` (the depth camera's `camera_info` frame is `CameraTop_optical_frame`, see section 11). Encoding follows the colour-space table in 4.2. With `compress: true` in `camera_parameters`, `encoding = "compressed bgr8"` and `data` is JPEG. Calibration comes from `share/camera_info/*.json`.

### `/face_publisher/{front,bottom}_camera` — `robot_toolkit_msgs/face_detection_msg`

Published only when NAOqi `FaceDetected` fires for that camera **and** at least one face was found ([face_detector.cpp:65-79,437-530](src/vision_tools/face_detector.cpp)).

| Field | Type | Content |
|---|---|---|
| `faces` | `sensor_msgs/Image[]` | One **cropped image per face** (bounding box expanded by 9% each side, clipped to the image) |
| `points` | `geometry_msgs/Point[]` | Top-left corner of each crop in the source image in pixels (`x`, `y`); `z = -1` |

### `/mic` — `naoqi_bridge_msgs/AudioBuffer`

Raw microphone buffer from `ALAudioDevice` ([mic_event.cpp:209-248](src/audio_tools/mic/mic_event.cpp)): `header.stamp`, `frequency` (**always 48000**, even if 16000 was requested), `channelMap` (4 channel indices; `[3,5,0,2]` or `[0,2,1,4]` depending on the robot's microphone configuration), `data` (`int16[]`, interleaved samples).

### `/audio_localization` — `robot_toolkit_msgs/audio_localization_msg`

From NAOqi `ALSoundLocalization/SoundLocated` ([mic_localization_event.cpp:65-87](src/audio_tools/mic/mic_localization_event.cpp)).

| Field | Type | Meaning |
|---|---|---|
| `header.stamp` | time | Time received |
| `azimuth` | float | Horizontal angle of the sound (rad) |
| `elevation` | float | Vertical angle of the sound (rad) |
| `confidendce` | float | Confidence. **Misspelled in the message** |
| `energy` | float | Sound energy |
| `head_positions_in_frame_torso` | float32[] | Head pose (6 values) in the torso frame |
| `head_positions_in_frame_robot` | float32[] | Head pose in the robot frame |

### `/sonar/front`, `/sonar/back` — `sensor_msgs/Range`

`frame_id` `SonarFront_frame` / `SonarBack_frame`, `radiation_type = ULTRASOUND`, `field_of_view = 0.5236` rad, `min_range = 0.25` m, `max_range = 2.55` m, `range` in metres (`-1` if a read fails) ([sonar_converter.cpp:35-54](src/misc_tools/sonar/sonar_converter.cpp)).

### `/touch` — `robot_toolkit_msgs/touch_msg`

| Field | Type | Meaning |
|---|---|---|
| `name` | string | `bumper_right`, `bumber_left`, `bumber_back` (**sic**), `head_front`, `head_middle`, `head_rear`, `hand_right_back`, `hand_right_left`, `hand_right_right`, `hand_left_back`, `hand_left_left`, `hand_left_right` |
| `state` | bool | `true` while pressed/touched |

### `/navigation/path` — `robot_toolkit_msgs/path_msg`

Single field `point_world` (`geometry_msgs/Vector3[]`), read from `NAOqiPlanner/Path` as consecutive `(x, y, z)` triplets. Empty when the planner has no path.

### `/navigation/robot_pose_publisher` — `geometry_msgs/Vector3`

`x`, `y`, `z` copied from `NAOqiLocalizer/RobotPose` (world x, y, and heading as the third value). All three are `NaN` while the localiser has no pose.

### `/navigation/result` — `std_msgs/String`

`data` = the raw string from `NAOqiPlanner/Result` each time the planner reports a result.

### `/free_zone/result` — `geometry_msgs/Pose2D`

Published once after each `/free_zone` request, after the robot has moved: the free-zone centre expressed in the robot frame (`x`, `y`; `theta = 0`).

---

## 6. Topics subscribed

| Topic | Type | Enabled by | Effect |
|---|---|---|---|
| `/cmd_vel` | `geometry_msgs/Twist` | navigation | `ALMotion.move(linear.x, linear.y, angular.z)` |
| `/move_base_simple/goal` | `geometry_msgs/PoseStamped` | navigation `enable_all` / `move_base_enable` | `ALMotion.moveTo(x, y, yaw)` |
| `/navigation/goal` | `geometry_msgs/Pose2D` | navigation | Raises `NAOqiPlanner/Goal` |
| `/navigation/robot_pose_subscriber` | `geometry_msgs/Pose2D` | navigation | Raises `NAOqiLocalizer/SetPose` |
| `/free_zone` | `geometry_msgs/Vector3` | navigation | Moves to the centre of a free zone |
| `/speech` | `robot_toolkit_msgs/speech_msg` | audio `enable_tts` | Text to speech |
| `/animations` | `robot_toolkit_msgs/animation_msg` | motion | Runs a behaviour |
| `/set_angles` | `robot_toolkit_msgs/set_angles_msg` | motion | Sets joint angles |
| `/leds` | `robot_toolkit_msgs/leds_parameters_msg` | misc | Fades LEDs |
| `/special_settings` | `robot_toolkit_msgs/special_settings_msg` | **active at startup** | Rest/wake, collision protection, awareness |

### `/cmd_vel` — `geometry_msgs/Twist`

| Field | Used | Units | Range |
|---|---|---|---|
| `linear.x` | yes | m/s | not clamped by the toolkit; limited by NAOqi |
| `linear.y` | yes | m/s | same |
| `angular.z` | yes | rad/s | same |
| `linear.z`, `angular.x`, `angular.y` | ignored | — | — |

**Watchdog:** after each message a timer (default **0.5 s**) is armed. If no new `/cmd_vel` arrives before it fires, the robot is sent `move(0,0,0)`. Publish continuously (e.g. 5-10 Hz) to keep moving. `security_timer <= 0` in `custom` disables the watchdog.

```bash
rostopic pub -r 10 /cmd_vel geometry_msgs/Twist "{linear: {x: 0.2, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}"
rostopic pub -1  /cmd_vel geometry_msgs/Twist "{linear: {x: 0.0, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}"
```

### `/move_base_simple/goal` — `geometry_msgs/PoseStamped`

If `header.frame_id == "base_footprint"` the pose is used directly; otherwise it is transformed to `base_footprint` using the toolkit's own TF buffer (2 s wait; requires the `/tf` converter to be running; unsupported frames are logged and ignored). `moveTo(position.x, position.y, yaw)` where yaw is taken from the quaternion ([move_to.cpp:44-79](src/navigation_tools/move_to/move_to.cpp)).

```bash
rostopic pub -1 /move_base_simple/goal geometry_msgs/PoseStamped \
  "{header: {frame_id: 'base_footprint'}, pose: {position: {x: 0.5, y: 0.0, z: 0.0}, orientation: {x: 0, y: 0, z: 0, w: 1}}}"
```

### `/navigation/goal` — `geometry_msgs/Pose2D`

`x`, `y` (m), `theta` (rad) are forwarded as a float vector to the `NAOqiPlanner/Goal` event; the external NAOqi planner module does the planning. Progress is reported on `/navigation/path` and `/navigation/result`.

```bash
rostopic pub -1 /navigation/goal geometry_msgs/Pose2D "{x: 1.0, y: 0.5, theta: 0.0}"
```

### `/navigation/robot_pose_subscriber` — `geometry_msgs/Pose2D`

Sets the localiser pose (`NAOqiLocalizer/SetPose`) from `x`, `y`, `theta`.

### `/free_zone` — `geometry_msgs/Vector3`

`x` = desired free-zone radius, `y` = displacement constraint. Calls `ALNavigation.getFreeZone(x, y)`, computes the zone centre relative to the robot, runs `moveTo`, **blocks until the move finishes**, then publishes `/free_zone/result`.

### `/speech` — `robot_toolkit_msgs/speech_msg`

| Field | Type | Meaning |
|---|---|---|
| `text` | string | Text to say |
| `language` | string | **`English` or `Spanish` only** (capitalised). Any other value makes the robot say a spoken apology |
| `animated` | bool | `true`: `ALAnimatedSpeech.say` (with gestures); `false`: `ALTextToSpeech.say` |

Default language at start is English. Speech is asynchronous.

```bash
rostopic pub -1 /speech robot_toolkit_msgs/speech_msg "{text: 'Hello', language: 'English', animated: true}"
```

### `/animations` — `robot_toolkit_msgs/animation_msg`

[animation_subscriber.cpp:41-70](src/motion_tools/animation_subscriber.cpp)

| Field | Type | Meaning |
|---|---|---|
| `family` | string | **Required.** `animations` -> `animations/Stand/<animation_name>`; `animations_sinfonia` -> `animations_sinfonia/animations/<animation_name>`. Any other family logs `Unkown animation family` and is ignored |
| `animation_name` | string | Behaviour path within the family, e.g. `Gestures/Hey_1` |

The behaviour must exist at `/home/nao/.local/share/PackageManager/apps/<resolved path>` on the robot; otherwise the toolkit logs `The animation does not exists` and does nothing. The behaviour is started asynchronously with `ALBehaviorManager.startBehavior`.

```bash
rostopic pub -1 /animations robot_toolkit_msgs/animation_msg "{family: 'animations', animation_name: 'Gestures/Hey_1'}"
```

### `/set_angles` — `robot_toolkit_msgs/set_angles_msg`

| Field | Type | Meaning |
|---|---|---|
| `names` | string[] | Joint names |
| `angles` | float32[] | Target angle per joint (rad) |
| `fraction_max_speed` | float32[] | Fraction of max speed per joint (`0..1`, NAOqi semantics) |

All three arrays **must have the same length**; otherwise the message is ignored. Each joint is sent with `ALMotion.setAngles`. Invalid joint names are skipped. Valid names and the limits in `share/urdf/pepper.urdf` (rad):

| Joint | Lower | Upper |
|---|---|---|
| `HeadYaw` | -2.0857 | 2.0857 |
| `HeadPitch` | -0.7069 | 0.6370 |
| `HipRoll` | -0.5149 | 0.5149 |
| `HipPitch` | -1.0385 | 1.0385 |
| `KneePitch` | -0.5149 | 0.5149 |
| `LShoulderPitch`, `RShoulderPitch` | -2.0857 | 2.0857 |
| `LShoulderRoll` | 0.0087 | 1.5621 |
| `RShoulderRoll` | -1.5621 | -0.0087 |
| `LElbowYaw`, `RElbowYaw` | -2.0857 | 2.0857 |
| `LElbowRoll` | -1.5621 | -0.0087 |
| `RElbowRoll` | 0.0087 | 1.5621 |
| `LWristYaw`, `RWristYaw` | -1.8239 | 1.8239 |
| `LHand`, `RHand` | 0.02 | 0.98 |

```bash
rostopic pub -1 /set_angles robot_toolkit_msgs/set_angles_msg \
  "{names: ['HeadYaw', 'HeadPitch'], angles: [0.5, -0.2], fraction_max_speed: [0.2, 0.2]}"
```

### `/leds` — `robot_toolkit_msgs/leds_parameters_msg`

| Field | Type | Meaning |
|---|---|---|
| `name` | string | NAOqi `ALLeds` device, RGB LED or group name (e.g. `FaceLeds`, `ChestLeds`). Invalid names are logged and ignored |
| `red`, `green`, `blue` | uint8 (`0..255`) | Colour, scaled to `0..1` |
| `time` | uint8 | Fade duration in **whole seconds** (the field is an unsigned byte, so fractions are not possible) |

If `name` contains `Ear`, only `blue` is applied (red/green are forced to 0). Uses `ALLeds.fadeRGB`.

```bash
rostopic pub -1 /leds robot_toolkit_msgs/leds_parameters_msg "{name: 'FaceLeds', red: 0, green: 255, blue: 0, time: 1}"
```

### `/special_settings` — `robot_toolkit_msgs/special_settings_msg`

[special_settings_subscriber.cpp:41-78](src/misc_tools/special_settings/special_settings_subscriber.cpp)

| `command` | Uses | Effect |
|---|---|---|
| `rest` | `state` | `true`: `ALMotion.rest()`; `false`: `ALMotion.wakeUp()` |
| `external_collision_protection_enabled` | `state` | `ALMotion.setExternalCollisionProtectionEnabled("Move", state)` |
| `set_security_distance` | `data` (float, m) | `ALMotion.setOrthogonalSecurityDistance(data)` |
| `awareness` | `state` | `ALBasicAwareness.setEnabled(state)` |

Other `command` values log `Special Settings error unknown command`. Fields: `command` (string), `state` (bool), `data` (float32).

```bash
rostopic pub -1 /special_settings robot_toolkit_msgs/special_settings_msg "{command: 'awareness', state: false, data: 0.0}"
```

---

## 7. Custom interfaces

Package **`robot_toolkit_msgs`** (`../robot_toolkit_msgs`, catkin, BSD; generation depends on `std_msgs` and `sensor_msgs`). It is not part of this repository but defines every custom interface the toolkit uses. Install it on the robot with `robot_toolkit_msgs.sh` (`--help` for options).

### 7.1 Messages used by this toolkit

```text
# animation_msg
string family            # "animations" (Pepper defaults) or "animations_sinfonia" (custom)
string animation_name

# audio_localization_msg
Header header
float32 azimuth          # rad
float32 elevation        # rad
float32 confidendce      # sic
float32 energy
float32[] head_positions_in_frame_torso
float32[] head_positions_in_frame_robot

# audio_tools_msg
string command           # enable, disable, enable_mic, disable_mic, custom, enable_tts, disable_tts,
                         # enable_localization, disable_localization,
                         # get_speech_params, set_speech_params, reset_speech_params
uint16 frequency         # 16000 or 48000
uint8 channels           # 0 ALL, 1 LEFT, 2 RIGHT, 3 FRONT, 4 REAR
robot_toolkit_msgs/speech_parameters_msg speech_parameters

# camera_parameters_msg  (ranges as documented in the file)
uint8 brightness         # [0,255]
uint8 contrast           # [0,127] default 32
uint8 saturation         # [0,255] default 64
int16 hue                # [-180,180]
bool horizontal_flip
bool vertical_flip
bool auto_exposition     # default 1
bool auto_white_balance  # default 1
bool auto_gain           # default 1
uint16 gain              # [0,1024]
uint16 exposure          # [0,65536] default 64
bool reset_camera_registers
uint16 blc_red_value     # [0,4096]
uint16 blc_green_value   # [0,4096]
uint16 blc_blue_value    # [0,4096]
uint8 resolution         # [0,8] default 1
uint8 fps                # [0,30] default 1
uint8 average_luminance  # [0,255]
bool auto_focus          # default 1
bool compress            # default 0
uint8 compression_factor # [0,100] default 97

# depth_to_laser_msg
uint8 resolution
float32 scan_time
float32 range_min
float32 range_max
float32 scan_height

# face_detection_msg
sensor_msgs/Image[] faces
geometry_msgs/Point[] points

# leds_parameters_msg
string name
uint8 red
uint8 green
uint8 blue
uint8 time

# misc_tools_msg
string command           # enable_all, disable_all, custom
string leds              # "enable", "disable" or empty (no change)
string sonars
string touch

# motion_tools_msg
string command           # enable_all, disable_all, custom
string animation         # "enable", "disable" or empty (no change)
string set_angles

# navigation_tools_msg
string command           # the file's comment lists enable_all / disable_all / custom;
                         # the code also handles enable_mapper, disable_mapper,
                         # enable_navigate and disable_navigate
bool tf_enable
float32 tf_frequency
bool odom_enable
float32 odom_frequency
bool laser_enable
float32 laser_frequency
bool cmd_vel_enable
float32 security_timer   # -1 disables
bool move_base_enable
bool goal_enable
bool robot_pose_suscriber_enable
bool path_enable
float32 path_frequency
bool robot_pose_publisher_enable
float32 robot_pose_publisher_frequency
bool result_enable
bool depth_to_laser_enable
robot_toolkit_msgs/depth_to_laser_msg depth_to_laser_parameters
bool free_zone_enable

# path_msg
geometry_msgs/Vector3[] point_world

# set_angles_msg
string[] names
float32[] angles
float32[] fraction_max_speed

# special_settings_msg
string command           # file comment: rest, external_collision_protection_enabled, awareness
                         # (the code also handles set_security_distance)
bool state
float32 data

# speech_msg
string language          # "Spanish" or "English"
string text
bool animated

# speech_parameters_msg
float32 pitch_shift              # [1.0, 4], 0 disables
float32 double_voice             # [1.0, 4], 0 disables
float32 double_voice_level       # [0, 4], 0 disables
float32 double_voice_time_shift  # [0, 0.5]
float32 speed                    # [50, 400], default 100

# touch_msg
string name
bool state

# vision_tools_msg
string camera_name
string command           # enable, disable, custom, set_parameters, get_parameters
uint8 resolution
uint8 frame_rate
uint8 color_space
robot_toolkit_msgs/camera_parameters_msg camera_parameters
```

### 7.2 Services served by this toolkit

```text
# navigation_tools_srv       # audio_tools_srv                         # vision_tools_srv
navigation_tools_msg data    audio_tools_msg data                      vision_tools_msg data
---                          ---                                       ---
string result                string result                             string result
                             speech_parameters_msg speech_parameters   camera_parameters_msg camera_parameters

# motion_tools_srv           # misc_tools_srv                          # speech_recognition_srv
motion_tools_msg data        misc_tools_msg data                       string[] words
---                          ---                                       float32 threshold
string result                string result                             ---
                                                                       string result
```

### 7.3 Services and topics served by `py_toolkit`

These types are used by the Python node described in Section 8 (the reduced copy `scripts/pyToolkit.py` uses only `go_to_posture_srv`, `tablet_service_srv`, `std_srvs/SetBool` and `std_srvs/Empty`).

```text
# go_to_posture_srv          # tablet_service_srv         # battery_service_srv
string posture               string url                   ---
---                          ---                          string porcentage
string approved              string approved
```

| Interface | Request | Response | Served as (`/pytoolkit/...`) |
|---|---|---|---|
| `battery_service_srv` | none | `string porcentage` | 15 services that take no input: `ALAudioDevice/get_output_volume_srv`, `ALTextToSpeech/shut_up_srv`, `ALAudioPlayer/stop_audio_stream_srv`, `ALTracker/start_follow_face`, `.../start_tracker_srv`, `.../stop_tracker_srv`, `ALBasicAwareness/pause_awareness_srv`, `.../resume_awareness_srv`, `ALMotion/enable_security_srv`, `ALNavigation/stop_exploring_srv`, `ALBatteryService/get_porcentage`, `ALTabletService/show_words_srv`, `.../show_picture_srv`, `.../hide_srv`, `.../overload_srv` |
| `get_input_srv` | `string type`, `string text` | `string input` | `ALTabletService/get_input_srv` |
| `get_segmentation3D_srv` | none | `float64[] coordinates` | `ALSegmentation3D/get_segmentation3D_srv` |
| `go_to_posture_srv` | `string posture` | `string approved` | `ALRobotPosture/go_to_posture_srv`, `ALBasicAwareness/set_tracking_mode_srv` |
| `move_head_srv` | `string state` | `string approved` | `ALMotion/move_head_srv` |
| `navigate_to_srv` | `float64 x_coordinate`, `float64 y_coordinate` | `string approved` | `ALMotion/move_relative_srv`, `ALNavigation/navigate_to_srv` |
| `point_at_srv` | `float64 x, y, z`, `string effector_name`, `int32 frame`, `float64 speed` | `string approved` | `ALTracker/point_at_srv` |
| `say_to_file_srv` | `string text` | `uint8[] data` | `ALTextToSpeech/say_to_file_srv` |
| `set_angle_srv` | `string[] name`, `float64[] angle`, `float64 speed` | `string result` | `ALMotion/set_angle_srv`, `ALMotion/toggle_get_angle_srv` |
| `set_move_arms_enabled_srv` | `bool LArm`, `bool RArm` | `string answer` | `ALMotion/set_move_arms_enabled_srv` |
| `set_open_close_hand_srv` | `string hand`, `string state` | `string approved` | `ALMotion/set_open_close_hand_srv`, `ALMotion/toggle_breathing_srv` |
| `set_output_volume_srv` | `int32 volume` | `string approved` | `ALAudioDevice/set_output_volume_srv`, `ALMotion/play_dance_srv`, `ALNavigation/start_exploring_srv` |
| `set_security_distance_srv` | `float64 distance` | `string approved` | three `ALMotion/set_*security_distance_srv` services |
| `set_speechrecognition_srv` | `bool subscribe`, `bool noise`, `bool eyes` | `string approved` | `ALSpeechRecognition/set_speechrecognition_srv` |
| `set_stiffnesses_srv` | `string names`, `float64 stiffnesses` | `string result` | `ALMotion/set_stiffnesses_srv`, `ALAudioPlayer/play_audio_stream_srv` |
| `set_words_threshold_srv` | `string[] words`, `float32[] threshold` | `string result` | `ALSpeechRecognition/set_words_srv` |
| `tablet_service_srv` | `string url` | `string approved` | `show_image_srv`, `show_web_view_srv`, `show_topic_srv`, `play_video_srv`, `ALSpeechRecognition/set_hot_word_language_srv`, `ALAudioPlayer/play_sound_effect_srv` |
| `speech_recognition_status_msg` (msg) | `string status` | n/a | topics `ALSpeechRecognition/status`, `.../SpeechDetected`, `ALMotion/failed`, `ALSensors/obstacles` |
| `text_to_speech_status_msg` (msg) | `int32 idOfConcernedTask`, `string status` | n/a | topic `ALTextToSpeech/status` |
| `Tshirt_color_srv` | none | `string color` | **Not served**: the registration in `py_toolkit.py` is commented out |

(`std_srvs/SetBool` and `std_srvs/Empty` are also used.) `speech_recognition_srv` is served by the C++ toolkit (Section 4.6), not by `py_toolkit`, which imports it without using it.

External message types also used by the toolkit: `naoqi_bridge_msgs/AudioBuffer` (`/mic`), `naoqi_bridge_msgs/RobotInfo` and `SetString` (included by the helpers, not exposed), and standard `geometry_msgs`, `nav_msgs`, `sensor_msgs`, `std_msgs`, `tf2_msgs`, `std_srvs`.

---

## 8. Python node `pytoolkit`

The Python side of the stack lives in the separate **`py_toolkit`** package (`../py_toolkit`, ROS 1, **Python 2.7**, catkin). Its README describes it as a complement to `sinfonia_toolkit`. It runs one `rospy` node named `pytoolkit` that talks to NAOqi through `qi` and exposes **51 services, 6 published topics and 2 subscribed topics**, all under `pytoolkit/...` (Section 8.2 to 8.4). `sinfonia_toolkit/scripts/pyToolkit.py` is a much smaller earlier copy (Section 8.6).

### 8.1 Starting it

```bash
# on the robot (or any machine that can reach NAOqi), with ROS sourced
rosrun py_toolkit py_toolkit.py --ip 127.0.0.1 --port 9559
```

| Argument | Type | Default | Meaning |
|---|---|---|---|
| `--ip` | string | `127.0.0.1` | NAOqi address (`127.0.0.1` when running on the robot) |
| `--port` | int | `9559` | NAOqi port |

Install (from the README): clone `py_toolkit` and `robot_toolkit_msgs` into a catkin workspace and run `catkin_make`. `CMakeLists.txt` installs nothing and does not mark the scripts executable, so use `rosrun` only after `chmod +x src/py_toolkit.py`, or run `python src/py_toolkit.py`. There are no ROS parameters or launch files.

**Things the node does at start-up** ([py_toolkit.py:1560-1602](../py_toolkit/src/py_toolkit.py)), so expect the robot to react as soon as it starts:

1. Stops the NAOqi `AppLauncher` service (errors ignored).
2. Enables autonomous blinking.
3. If `ALAutonomousLife` is not `disabled`: sets it to `disabled`, waits 2 s, goes to the `Stand` posture.
4. Disables `ALBasicAwareness` if it is enabled.
5. Sets the tracker's maximum detection distance to 0.1 m and stops it.
6. Hides the tablet, enables `ALSpeakingMovement`, then shows `http://198.18.0.1/apps/robot-page/img/SinfonIA-Tablet.png` on the tablet.
7. Subscribes `ALCloseObjectDetection` and `ALSegmentation3D` with the id `pytoolkit`.

**Naming.** Topic names are absolute (`/pytoolkit/...`). Service names are written without a leading slash; with `init_node("pytoolkit")` in the root namespace they resolve to `/pytoolkit/...`.

### 8.2 Topics published

All have `queue_size=10`. Message types are from `robot_toolkit_msgs`.

| Topic | Type | When |
|---|---|---|
| `/pytoolkit/ALTextToSpeech/status` | `text_to_speech_status_msg` (`int32 idOfConcernedTask`, `string status`) | NAOqi `ALTextToSpeech/Status` event (task id and status string such as started/done, as NAOqi reports them) |
| `/pytoolkit/ALMotion/failed` | `speech_recognition_status_msg` (`string status`) | NAOqi `ALMotion/MoveFailed`; `status` is the first element of the event value |
| `/pytoolkit/ALSpeechRecognition/status` | `speech_recognition_status_msg` | NAOqi `WordRecognized`: published only if the word is in the list set by `set_words_srv` **and** its confidence is greater than that word's threshold. Other words only print `word not in list` |
| `/pytoolkit/ALSpeechRecognition/SpeechDetected` | `speech_recognition_status_msg` | `status = "started"` or `"stopped"` when NAOqi `SpeechDetected` becomes 1 or 0 |
| `/pytoolkit/ALMotion/get_angles` | `set_angles_msg` | About every 0.1 s after `toggle_get_angle_srv` is called: `names` = requested joints, `angles` = current angles in rad (commanded actuator values, not sensor readings: the code calls `getAngles(names, False)`), `fraction_max_speed` empty |
| `/pytoolkit/ALSensors/obstacles` | `speech_recognition_status_msg` | Advertised but **never published** (the code that fed it is commented out) |

Speech recognition only produces events after you enable it with `set_speechrecognition_srv` and set a vocabulary with `set_words_srv`.

### 8.3 Topics subscribed

| Topic | Type | Behaviour |
|---|---|---|
| `/pytoolkit/ALMotion/move` | `geometry_msgs/Twist` | An **all-zero** Twist calls `ALMotion.stopMove()`; anything else calls `ALMotion.move(linear.x, linear.y, angular.z)`. No watchdog: the robot keeps moving until you send zeros |
| `/speech` | `robot_toolkit_msgs/speech_msg` | **Does not speak.** Only while `show_words_srv` is active (Section 8.4, tablet), it strips NAOqi markup (`\pau=...\`, `\rspd=...\`) and shows the text on the tablet word by word (450 ms per word if `language` is `Spanish`, 300 ms if `English`). The robot's voice comes from the `robot_toolkit` `/speech` subscriber, which reads the same topic |

```bash
rostopic pub -r 10 /pytoolkit/ALMotion/move geometry_msgs/Twist "{linear: {x: 0.2, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}"
rostopic pub -1  /pytoolkit/ALMotion/move geometry_msgs/Twist "{}"      # stop
```

### 8.4 Services

Request and response fields come from the `robot_toolkit_msgs` definitions (Section 7). Most handlers print to the console and return `"OK"` in the response's single string field (exceptions are noted in the tables). Response field names depend on the service type:

| Service type | Request | Response field |
|---|---|---|
| `battery_service_srv` | none | `porcentage` (string) |
| `tablet_service_srv`, `go_to_posture_srv`, `move_head_srv`, `navigate_to_srv`, `set_output_volume_srv`, `set_security_distance_srv`, `set_open_close_hand_srv`, `set_speechrecognition_srv`, `point_at_srv` | see tables | `approved` (string) |
| `set_angle_srv`, `set_stiffnesses_srv`, `set_words_threshold_srv` | see tables | `result` (string) |
| `std_srvs/SetBool` | `data` (bool) | `success` (bool), `message` (string) |
| `set_move_arms_enabled_srv` | `LArm`, `RArm` (bool) | `answer` (string) |
| `get_input_srv` | `type`, `text` (string) | `input` (string) |
| `say_to_file_srv` | `text` | `data` (uint8[]) |
| `get_segmentation3D_srv` | none | `coordinates` (float64[]) |

Several services **reuse a type whose field names do not match their meaning**; those are called out below.

#### Audio, speech and sound

| Service (`pytoolkit/...`) | Type | Request | Behaviour |
|---|---|---|---|
| `ALAudioDevice/set_output_volume_srv` | `set_output_volume_srv` | `volume` (int32) | `ALAudioDevice.setOutputVolume(volume)`; value is passed to NAOqi unchanged |
| `ALAudioDevice/get_output_volume_srv` | `battery_service_srv` | none | Returns the output volume as a string in `porcentage` |
| `ALTextToSpeech/shut_up_srv` | `battery_service_srv` | none | `ALTextToSpeech.stopAll()` |
| `ALTextToSpeech/say_to_file_srv` | `say_to_file_srv` | `text` | Synthesises to `/tmp/say_to_file.raw` **on the machine running the node**, returns the file bytes in `data` |
| `ALSpeechRecognition/set_speechrecognition_srv` | `set_speechrecognition_srv` | `subscribe`, `noise`, `eyes` (bool) | `subscribe=true`: subscribe as `isHearing` and un-pause; `false`: unsubscribe and pause. `noise` sets the audio expression (beep), `eyes` the visual expression (eye LEDs) |
| `ALSpeechRecognition/set_words_srv` | `set_words_threshold_srv` | `words` (string[]), `threshold` (float32[], one per word) | If `words` is not empty: pause, clear contexts, set the vocabulary, store words and thresholds, un-pause. Empty `words` does nothing |
| `ALSpeechRecognition/set_hot_word_language_srv` | `tablet_service_srv` | `url` = **language name** | `ALSpeechRecognition.setLanguage(url)` (pause/un-pause around it) |
| `ALAudioPlayer/play_sound_effect_srv` | `tablet_service_srv` | `url` = **file path on the robot** | `ALAudioPlayer.playSoundSetFile(url)` |
| `ALAudioPlayer/play_audio_stream_srv` | `set_stiffnesses_srv` | `names` = **stream URL**, `stiffnesses` = **volume** | `ALAudioPlayer.playWebStream(url, volume, 0)` |
| `ALAudioPlayer/stop_audio_stream_srv` | `battery_service_srv` | none | `ALAudioPlayer.stopAll()` |
| `ALMotion/play_dance_srv` | `set_output_volume_srv` | `volume` = **dance id**: `1` Arcadia, `2` hands (no music), `3` Asereje | Goes to `Stand`, runs the choreography **inside the call (blocks until it ends)**, then stops audio. Music files are read from `/home/nao/ros_ws/toolkit_ws/src/py_toolkit/resources/` on the robot. Other ids only stand up |

#### Life, awareness and tracking

| Service | Type | Request | Behaviour |
|---|---|---|---|
| `ALAutonomousLife/set_state_srv` | `SetBool` | `data` | `true`: enable all abilities, state `interactive`. `false`: disable abilities, state `disabled`, stop all, go to `Stand` |
| `ALAutonomousBlinking/toggle_blinking_srv` | `SetBool` | `data` | `ALAutonomousBlinking.setEnabled(data)` |
| `ALBasicAwareness/set_awareness_srv` | `SetBool` | `data` | Head to default pose, then `setEnabled(data)` |
| `ALBasicAwareness/pause_awareness_srv` | `battery_service_srv` | none | Head to default; runs start/resume/pause/stop awareness in sequence; tracker max distance 0.1 m; stops the tracker |
| `ALBasicAwareness/resume_awareness_srv` | `battery_service_srv` | none | Head to default; stop/start/pause/resume awareness |
| `ALBasicAwareness/set_tracking_mode_srv` | `go_to_posture_srv` | `posture` = **tracking mode**: `Head`, `BodyRotation`, `WholeBody`, `MoveContextually` | `setTrackingMode(mode)`; returns `"OK"` or `"ERROR"` for an invalid mode |
| `ALTracker/start_follow_face` | `battery_service_srv` | none | Head default, max distance 3.5 m, tracker mode `Move`, registers target `Face` (face width 0.2 m) and tracks it (the robot walks after the face) |
| `ALTracker/start_tracker_srv` | `battery_service_srv` | none | Head default, max distance 3.5 m, `initialize()` |
| `ALTracker/stop_tracker_srv` | `battery_service_srv` | none | Head default, max distance 0.1 m, `stopTracker()` |
| `ALTracker/point_at_srv` | `point_at_srv` | `x`, `y`, `z` (float64), `effector_name` (string), `frame` (int32), `speed` (float64) | `ALTracker.pointAt(effector, [x, y, z], frame, speed)`; `frame` and `speed` follow NAOqi's definitions |
| `ALServiceManager/toggle_applauncher_srv` | `SetBool` | `data` | `true`: set life `interactive` if `disabled`, start the `AppLauncher` service, load and show the `app-launcher` page on the tablet. `false`: stop `AppLauncher` |

#### Motion

| Service | Type | Request | Behaviour |
|---|---|---|---|
| `ALMotion/move_head_srv` | `move_head_srv` | `state`: `up`, `down`, `default` | `up`: pitch -0.4 rad, yaw 0, speed 0.15. `down`: pitch 0.46, yaw 0, speed 0.2. `default`: 0, 0, speed 0.2. Other values do nothing |
| `ALMotion/set_angle_srv` | `set_angle_srv` | `name` (string[]), `angle` (float64[], rad), `speed` (float64, fraction of max speed) | `ALMotion.setAngles(names, angles, speed)`; **one speed for all joints**, no name validation |
| `ALMotion/toggle_get_angle_srv` | `set_angle_srv` | `name` (string[]) | Starts a thread that publishes `/pytoolkit/ALMotion/get_angles` every ~0.1 s. See Section 8.7: it cannot be switched off |
| `ALMotion/set_open_close_hand_srv` | `set_open_close_hand_srv` | `hand`: `left`, `right`, `both`; `state`: `open`, `close` | Sets `LHand` / `RHand` to 1.0 (open) or 0.0 (close) at speed 0.2 |
| `ALMotion/toggle_breathing_srv` | `set_open_close_hand_srv` | `hand` = **chain name** (e.g. `Body`), `state`: `"True"` or `"False"` (strings) | `ALMotion.setBreathEnabled(chain, state)` |
| `ALMotion/set_move_arms_enabled_srv` | `set_move_arms_enabled_srv` | `LArm`, `RArm` (bool) | `setMoveArmsEnabled`, then polls and re-sends until NAOqi reports the requested state (no time limit) |
| `ALMotion/set_stiffnesses_srv` | `set_stiffnesses_srv` | `names` (string, joint or chain, e.g. `Body`), `stiffnesses` (float64, 0..1) | `ALMotion.setStiffnesses(names, stiffnesses)` |
| `ALMotion/toggle_smart_stiffness_srv` | `SetBool` | `data` | `ALMotion.setSmartStiffnessEnabled(data)` |
| `ALMotion/move_relative_srv` | `navigate_to_srv` | `x_coordinate`, `y_coordinate` (float64, m) | `ALMotion.moveTo(x, y, 0)`, relative to the robot, no rotation |
| `ALRobotPosture/go_to_posture_srv` | `go_to_posture_srv` | `posture`: `stand` or `rest` | `stand`: posture `Stand` at speed 0.5. `rest`: `Crouch` at 0.5, then `ALMotion.rest()`. Other values do nothing |

Collision-protection services:

| Service | Type | Request | Behaviour |
|---|---|---|---|
| `ALMotion/set_security_distance_srv` | `set_security_distance_srv` | `distance` (float64, m) | Sets the orthogonal **and** tangential security distance, **and turns off** arm collision protection and external collision protection for `All`. Side effect, not just a distance change |
| `ALMotion/set_orthogonal_security_distance_srv` | `set_security_distance_srv` | `distance` | `setOrthogonalSecurityDistance` only |
| `ALMotion/set_tangential_security_distance_srv` | `set_security_distance_srv` | `distance` | `setTangentialSecurityDistance` only |
| `ALMotion/set_arms_security_srv` | `SetBool` | `data` | Arm collision protection and external arm collision protection = `data` |
| `ALMotion/enable_security_srv` | `battery_service_srv` | none | Orthogonal 0.4 m, tangential 0.1 m, arm collision protection on, external protection `All` on |

#### Navigation and perception

| Service | Type | Request | Behaviour |
|---|---|---|---|
| `ALNavigation/navigate_to_srv` | `navigate_to_srv` | `x_coordinate`, `y_coordinate` (float64, m) | `ALNavigation.navigateTo(x, y)`, called synchronously inside the handler |
| `ALNavigation/start_exploring_srv` | `set_output_volume_srv` | `volume` = **exploration radius in m** | `ALNavigation.explore(radius)`; a NAOqi `RuntimeError` is treated as "finished". Blocks until exploration ends |
| `ALNavigation/stop_exploring_srv` | `battery_service_srv` | none | `ALNavigation.stopExploration()` |
| `ALSegmentation3D/get_segmentation3D_srv` | `get_segmentation3D_srv` | none | `coordinates` = the list returned by `ALSegmentation3D.getTopOfBlob(-1, 0, False)` (layout as NAOqi returns it) |
| `ALBatteryService/get_porcentage` | `battery_service_srv` | none | `porcentage` = `ALBattery.getBatteryCharge()` as a string |

#### Tablet

The tablet pages come from a **`robot-page` application that must already be installed on the robot** (served at `http://198.18.0.1/apps/robot-page/`); it is not in any of the three repositories.

| Service | Type | Request | Behaviour |
|---|---|---|---|
| `ALTabletService/show_image_srv` | `tablet_service_srv` | `url` | Hides the tablet, waits 1 s, `showImage(url)`; reconnects to `ALTabletService` on error. Clears the "show words" mode |
| `ALTabletService/show_web_view_srv` | `tablet_service_srv` | `url` | `showWebview(url)` |
| `ALTabletService/show_topic_srv` | `tablet_service_srv` | `url` = **ROS image topic name** | Opens `http://<ip>:8080/stream_viewer?topic=<url>` (a `web_video_server` stream viewer) and injects JavaScript to restyle the page (dark background, 614 px high). `<ip>` is read from `resources/topic_srv.txt` (currently `192.168.0.229`) |
| `ALTabletService/play_video_srv` | `tablet_service_srv` | `url` | `playVideo(url)` |
| `ALTabletService/get_input_srv` | `get_input_srv` | `type`, `text` | Shows an input page and **blocks until the user answers**, then hides the tablet and returns the answer in `input`. `type = text`: label `text`, free text box. `type = bool`: label `text`, Yes/No buttons, returns `yes` or `no`. `type = list`: `text` is a **comma-separated list of options**, returns the chosen one. No timeout, one request at a time |
| `ALTabletService/show_words_srv` | `battery_service_srv` | none | Shows the `show_words.html` page and enables mirroring of `/speech` text (Section 8.3) |
| `ALTabletService/show_picture_srv` | `battery_service_srv` | none | Takes a photo (`ALPhotoCapture`, saved to the robot-page `img/picture.jpg`), waits 2 s and displays it without cache |
| `ALTabletService/hide_srv` | `battery_service_srv` | none | `ALTabletService.hide()` |
| `ALTabletService/overload_srv` | `battery_service_srv` | none | Loads the `webdisplay` application 10 times (1.5 s apart) and then hides the tablet. A reset/workaround helper |

### 8.5 Other files in the package

| Path | What it is |
|---|---|
| `src/dance_arcadia.py`, `dance_asereje.py`, `dance_hands.py` | Choreographies used by `play_dance_srv` (`angleInterpolation` / `angleInterpolationBezier`, music on a thread) |
| `src/ConsoleFormatter.py` | Coloured console output |
| `src/move.py` | Stand-alone test: connects to NAOqi at `127.0.0.1:9559`, drives backwards at 1 m/s for 10 s, stops. Not part of the node |
| `src/NavigationUtilities.py` | A "follow you" tracker sketch. **Not runnable**: it has syntax errors (`_init_` / `_name_` instead of `__init__` / `__name__`, broken line continuations). Not part of the node |
| `src/py_toolkit.py.save` | Empty editor backup |
| `resources/codigot.txt`, `codigob.txt`, `codigol.txt` | JavaScript injected into the tablet by `get_input_srv` (`+++++` is replaced by `text`) |
| `resources/topic_srv.txt` | IP of the machine running `web_video_server` (read by `show_topic_srv`) |
| `resources/arcadia_30.wav`, `asereje.wav` | Dance music |

### 8.6 The reduced copy in `sinfonia_toolkit/scripts/pyToolkit.py`

`scripts/pyToolkit.py` is an earlier, much smaller copy of the same node (same name `pytoolkit`, same `--ip`/`--port` arguments) with only these services, all identical in name and type to the ones above except where noted: `ALAutonomousLife/set_state_srv` (`SetBool`; omits `stopAll()`), `ALBasicAwareness/set_awareness_srv` (`SetBool`; does not move the head and uses `pauseAwareness()` for `false`), `ALRobotPosture/go_to_posture_srv` (does not call `ALMotion.rest()`), `ALTabletService/show_image_srv`, `show_web_view_srv`, `play_video_srv` (no hide/reconnect logic) and `ALTabletService/hide_srv` (typed `std_srvs/Empty` here, `battery_service_srv` in `py_toolkit`). **Use `py_toolkit`.** Both register the node name `pytoolkit`, so starting both makes ROS 1 shut down whichever started first.

### 8.7 Quirks of `py_toolkit`

| # | Issue | Workaround |
|---|---|---|
| 1 | `toggle_get_angle_srv` is not a toggle. The publishing thread runs `while self.publish_angles != "None"`, but `publish_angles` is the request's `name` list, which never equals the string `"None"`. Every call starts another thread and none can be stopped | Restart the node to stop publishing; call it once |
| 2 | `README.md` shows `set_words_srv` with `threshold: 0.5`; the field is `float32[]` (one value per word) and the example is not valid YAML | `{words: ['yes','no'], threshold: [0.4, 0.4]}` |
| 3 | `set_security_distance_srv` also disables arm and external collision protection | Use `set_orthogonal_...` / `set_tangential_...` if you only want a distance |
| 4 | Types reused with misleading names: `play_audio_stream_srv` (`names` = URL, `stiffnesses` = volume), `play_dance_srv` and `start_exploring_srv` (`volume` = dance id / radius), `set_tracking_mode_srv` (`posture` = mode), `set_hot_word_language_srv`, `play_sound_effect_srv`, `show_topic_srv` (`url` = language / file / topic) | Follow the tables above |
| 5 | `get_input_srv` and `set_move_arms_enabled_srv` can block forever (busy loops with no timeout) | Set a client timeout; do not call twice concurrently |
| 6 | `play_dance_srv`, `start_exploring_srv` and `get_input_srv` hold the service thread until they finish | Call from a client that tolerates long calls |
| 7 | `show_topic_srv` depends on a hard-coded IP in `resources/topic_srv.txt` and on `web_video_server` on port 8080 | Edit the file for your network |
| 8 | Dance music paths are hard-coded to `/home/nao/ros_ws/toolkit_ws/src/py_toolkit/resources/` | Install the package at that path on the robot |
| 9 | Tablet error handlers rebuild the NAOqi proxy from the global `session`; `overload_srv` and `toggle_applauncher_srv` use the global `pytoolkit` | Only matters if you import the class from another module |
| 10 | `node` creates publishers and services **before** `rospy.init_node("pytoolkit")` (same ordering as `scripts/pyToolkit.py`). Since this is the team's working node, it evidently starts, but I did not run it | None needed |
| 11 | `Tshirt_color_srv` and `speech_recognition_srv` are imported but never served (the Tshirt service is commented out) | n/a |

### 8.8 Examples

```bash
rosservice call /pytoolkit/ALRobotPosture/go_to_posture_srv "posture: 'stand'"
rosservice call /pytoolkit/ALMotion/move_head_srv "state: 'up'"
rosservice call /pytoolkit/ALMotion/set_angle_srv "{name: ['HeadYaw','HeadPitch'], angle: [0.5, -0.2], speed: 0.2}"
rosservice call /pytoolkit/ALMotion/set_open_close_hand_srv "{hand: 'both', state: 'open'}"
rosservice call /pytoolkit/ALMotion/set_stiffnesses_srv "{names: 'Body', stiffnesses: 1.0}"
rosservice call /pytoolkit/ALMotion/play_dance_srv "volume: 1"
rosservice call /pytoolkit/ALSpeechRecognition/set_speechrecognition_srv "{subscribe: true, noise: false, eyes: true}"
rosservice call /pytoolkit/ALSpeechRecognition/set_words_srv "{words: ['yes','no'], threshold: [0.4, 0.4]}"
rostopic echo /pytoolkit/ALSpeechRecognition/status
rosservice call /pytoolkit/ALTabletService/show_web_view_srv "url: 'http://example.com'"
rosservice call /pytoolkit/ALTabletService/get_input_srv "{type: 'bool', text: 'Do you want coffee?'}"
rosservice call /pytoolkit/ALBatteryService/get_porcentage
rosservice call /pytoolkit/ALAutonomousLife/set_state_srv "data: false"
```

```javascript
import { Ros, Topic, Service } from 'roslib';

const ros = new Ros({ url: 'ws://192.168.0.10:9090' });

// Helper-free pattern: one Service per interface, plain-object request, error callback.
const goToPosture = new Service({
  ros,
  name: '/pytoolkit/ALRobotPosture/go_to_posture_srv',
  serviceType: 'robot_toolkit_msgs/go_to_posture_srv',
});
goToPosture.callService({ posture: 'stand' }, (r) => console.log(r.approved), (e) => console.error(e));

const moveHead = new Service({
  ros,
  name: '/pytoolkit/ALMotion/move_head_srv',
  serviceType: 'robot_toolkit_msgs/move_head_srv',
});
moveHead.callService({ state: 'down' }, (r) => console.log(r.approved), (e) => console.error(e));

const setAngle = new Service({
  ros,
  name: '/pytoolkit/ALMotion/set_angle_srv',
  serviceType: 'robot_toolkit_msgs/set_angle_srv',
});
setAngle.callService(
  { name: ['HeadYaw', 'HeadPitch'], angle: [0.5, -0.2], speed: 0.2 },
  (r) => console.log(r.result),
  (e) => console.error(e),
);

// Voice commands: enable recognition, set a vocabulary, listen on the status topic.
const enableSR = new Service({
  ros,
  name: '/pytoolkit/ALSpeechRecognition/set_speechrecognition_srv',
  serviceType: 'robot_toolkit_msgs/set_speechrecognition_srv',
});
const setWords = new Service({
  ros,
  name: '/pytoolkit/ALSpeechRecognition/set_words_srv',
  serviceType: 'robot_toolkit_msgs/set_words_threshold_srv',
});
enableSR.callService({ subscribe: true, noise: false, eyes: true }, () => {
  setWords.callService({ words: ['yes', 'no'], threshold: [0.4, 0.4] }, () => {
    new Topic({
      ros,
      name: '/pytoolkit/ALSpeechRecognition/status',
      messageType: 'robot_toolkit_msgs/speech_recognition_status_msg',
    }).subscribe((m) => console.log('heard:', m.status));
  }, (e) => console.error(e));
}, (e) => console.error(e));

// Ask the user a yes/no question on the tablet (blocks on the robot until answered).
const getInput = new Service({
  ros,
  name: '/pytoolkit/ALTabletService/get_input_srv',
  serviceType: 'robot_toolkit_msgs/get_input_srv',
});
getInput.callService({ type: 'bool', text: 'Do you want coffee?' }, (r) => console.log('answer:', r.input), (e) => console.error(e));

// Services with no request fields take {}. The response field is "porcentage" for battery_service_srv.
const battery = new Service({
  ros,
  name: '/pytoolkit/ALBatteryService/get_porcentage',
  serviceType: 'robot_toolkit_msgs/battery_service_srv',
});
battery.callService({}, (r) => console.log('battery %:', r.porcentage), (e) => console.error(e));

// SetBool services use std_srvs
const life = new Service({
  ros,
  name: '/pytoolkit/ALAutonomousLife/set_state_srv',
  serviceType: 'std_srvs/SetBool',
});
life.callService({ data: false }, (r) => console.log(r.success, r.message), (e) => console.error(e));

// Drive through py_toolkit (stops only when you send zeros)
const move = new Topic({ ros, name: '/pytoolkit/ALMotion/move', messageType: 'geometry_msgs/Twist' });
move.publish({ linear: { x: 0.2, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } });
move.publish({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } });   // stop
```

---

## 9. External NAOqi dependencies

**NAOqi services used by `robot_toolkit`:** `ALMotion`, `ALMemory`, `ALBehaviorManager`, `ALTextToSpeech`, `ALAnimatedSpeech`, `ALLeds`, `ALSonar`, `ALAudioDevice`, `ALRobotModel`, `ALSpeechRecognition`, `ALSoundDetection`, `ALVideoDevice`, `ALNavigation`, `ALBasicAwareness`.

**Additionally used by `py_toolkit`:** `ALAudioPlayer`, `ALAutonomousBlinking`, `ALAutonomousLife`, `ALBattery`, `ALCloseObjectDetection`, `ALPeoplePerception`, `ALPhotoCapture`, `ALRobotPosture`, `ALSegmentation3D`, `ALServiceManager`, `ALSpeakingMovement`, `ALTabletService`, `ALTracker`, plus the `ALMemory` events `ALTextToSpeech/Status`, `WordRecognized`, `SpeechDetected`, `ALMotion/MoveFailed` and `PeoplePerception/JustArrived`. It also needs the `robot-page` tablet application installed on the robot (`http://198.18.0.1/apps/robot-page/`: `input1/2/3.html`, `show_words.html`, `img/SinfonIA-Tablet.png`), which is not in any of the repositories.

**Custom NAOqi modules/keys that must exist on the robot** (not part of this repo; features degrade or log "not available" without them):

| Key / event | Used by |
|---|---|
| `NAOqiDepth2Laser/{Ranges,MinAngle,MaxAngle,NumRanges,MaxRange}` | `/depth_to_laser`, `/merged_laser` |
| `NAOqiPlanner/Goal` (event), `NAOqiPlanner/Path`, `NAOqiPlanner/Result` | `/navigation/goal`, `/navigation/path`, `/navigation/result` |
| `NAOqiLocalizer/SetPose` (event), `NAOqiLocalizer/RobotPose` | `/navigation/robot_pose_*` |
| `Device/SubDeviceList/Platform/LaserSensor/{Right,Front,Left}/Horizontal/Seg01..15/{X,Y}/Sensor/Value` | `/laser`, `/merged_laser` |
| `Device/SubDeviceList/Platform/{Front,Back}/Sonar/Sensor/Value` | `/sonar/*` |
| `ALSoundLocalization/SoundLocated`, `FaceDetected`, `WordRecognized`, `SoundDetected`, touch/bumper events (`RightBumperPressed`, `LeftBumperPressed`, `BackBumperPressed`, `Front/Middle/RearTactilTouched`, `HandRight/Left{Back,Left,Right}Touched`) | event converters |

The `PepperHeadSharedMemory`, `Depth2LaserSharedMemory`, `PepperLocalizerSharedMemory` and `PepperPlannerSharedMemory` writes in `robot_toolkit.cpp` are commented out and have no effect.

---

## 10. Resources, launch files and scripts

| Path | Purpose |
|---|---|
| `share/urdf/pepper.urdf` | Robot description used for TF and joint limits |
| `share/camera_info/{top,bottom,depth}_camera_info.json` | Per-resolution calibration |
| `launch/*.launch` | Four launch variants (eth/wlan x odom/no_odom) |
| `home_scripts/*.sh` | Robot-side helpers: `set_pepper_ip.sh` (exports `PEPPER_IP`, `PEPPER_USER`, `PEPPER_PASS`), `startRos.sh` (sets `ROS_MASTER_URI`, `ROS_HOSTNAME`, sources ROS Kinetic from the Gentoo prefix and `~/ros_ws/toolkit_ws`), `start_robot_toolkit_{eth,wlan}.sh`, `set_proxy.sh`, `unset_proxy.sh`, `set_time.sh`, `send_to_robot.sh`, `compress.sh`, `extract.sh`, `copy_scripts.sh` |
| `robot_toolkit.sh` | Build/deploy helper (`-m compile|install|run|all|kill|clean_vn|clean_robot|clean_all`, with `--vnip`, `--robotip`, `--vnpass`, `--robotpass`) |
| `scripts/ConsoleFormatter.py` | Coloured console output for `pyToolkit.py` |

Robot bring-up (from the project docs): `ssh nao@<PEPPER_IP>`, `./gentoo/startprefix`, `. startRos.sh`, then `. start_robot_toolkit_eth.sh` (or `_wlan.sh`).

---

## 11. Known quirks and bugs

Found while reading the code. Each is something a client developer will hit.

| # | Where | Issue | Workaround |
|---|---|---|---|
| 1 | [robot_toolkit.cpp:757-766](src/robot_toolkit.cpp) | `security_timer` is a `float32` in the message but is copied into an `int`, so `0.5` becomes `0` s. A 0-second watchdog stops the robot immediately after every `/cmd_vel`. | Use whole seconds `>= 1`, or `<= 0` to disable |
| 2 | [robot_toolkit.cpp:1254-1285, 1368-1415](src/robot_toolkit.cpp) | `enable_all` in motion/misc services returns an empty summary string because the following `else` branch overwrites it | Ignore `result`; features still start |
| 3 | [robot_toolkit.cpp:551-554](src/robot_toolkit.cpp) | `enable_navigate` text lists `depth_to_laser@10Hz` but never schedules it | Enable `/depth_to_laser` separately |
| 4 | navigation `custom` | `depth_to_laser_parameters` has no effect (section 4.1) | — |
| 5 | [touch_event.cpp:159-208](src/misc_tools/touch/touch_event.cpp) | `stopProcess()` has inverted `if(!id)` checks for 10 of 12 events, so they stay subscribed after `touch: disable` (only the publisher is shut down) | — |
| 6 | [touch_event.cpp:223-227](src/misc_tools/touch/touch_event.cpp) | Names `bumber_left` / `bumber_back` are misspelled | Match the misspelling |
| 7 | [mic_event.cpp:216](src/audio_tools/mic/mic_event.cpp) | `AudioBuffer.frequency` is hard-coded to 48000 | Trust the rate you requested |
| 8 | [camera_converter.cpp:276](src/vision_tools/camera_converter.cpp), [face_detector.cpp:296](src/vision_tools/face_detector.cpp) | `CameraInfo` is a function-level `static`, shared by all converter instances of that class; in `camera_converter.cpp` the depth camera's `camera_info` is given frame `CameraTop_optical_frame` | Do not rely on `camera_info` when several cameras are active |
| 9 | speech recognition | Blocking, English-only, no timeout/cancel | Client-side timeout; one call at a time |
| 10 | [pyToolkit.py:142-143](scripts/pyToolkit.py) | `PyToolkit(session)` registers services **before** `rospy.init_node('pytoolkit')`. `py_toolkit.py` (the full node the team uses) has the same order, so this probably works, but I have not run either. The last commit message calls the reduced script "NOT TESTED" | Move `rospy.init_node` first if startup fails. Quirks specific to `py_toolkit` are in Section 8.7 |
| 11 | [main.cpp:87](src/main.cpp) | `variablesMap["publish_odom"].as<bool>()` throws (bad cast) if `--roscore_ip` is given without `--publish_odom` | Always pass `--publish_odom true|false` with `--roscore_ip` |
| 12 | [robot_toolkit.cpp:125-130](src/robot_toolkit.cpp) | Publishing loop starts only in the `--roscore_ip` startup path (section 2) | Use `--roscore_ip` |
| 13 | `robot_toolkit_msgs` | `robot_pose_suscriber_enable` and `confidendce` are misspelled in the message definitions; `audio_tools_msg`, `speech_msg` and `vision_tools_msg` share a copy-pasted "Vision Tools Message" title comment | Use the exact spelling |
| 14 | `SetAnglesSubscriber::getParameters` and several `getParameters()` in `special_settings`/`navigation` classes | Declared to return `std::vector<float>` but have no `return` (undefined behaviour if ever called) | Not reachable through the public API today |

---

## 12. roslibjs usage

All examples use **roslib v2.1.0+**: requests, responses and topic messages are **plain JavaScript objects**. `ServiceRequest`, `ServiceResponse` and `Message` are not used. Rosbridge for ROS 1 must be running on the robot or a PC on the same ROS master:

```bash
roslaunch rosbridge_server rosbridge_websocket.launch   # default ws://<host>:9090
```

Type strings are the ROS 1 names (`pkg/msg_name`, `pkg/srv_name`).

### 12.1 Connection and helpers

```javascript
import { Ros, Topic, Service } from 'roslib';

const ros = new Ros({ url: 'ws://192.168.0.10:9090' });
ros.on('connection', () => console.log('Connected to rosbridge'));
ros.on('error', (error) => console.error('rosbridge error:', error));
ros.on('close', () => console.log('rosbridge connection closed'));

// Node name used for the relative camera topics (value of --namespace on the robot).
const NODE = '/robot_toolkit_node';
```

### 12.2 Services

```javascript
const vision = new Service({
  ros,
  name: '/robot_toolkit/vision_tools_srv',
  serviceType: 'robot_toolkit_msgs/vision_tools_srv',
});

const navigation = new Service({
  ros,
  name: '/robot_toolkit/navigation_tools_srv',
  serviceType: 'robot_toolkit_msgs/navigation_tools_srv',
});

const audio = new Service({
  ros,
  name: '/robot_toolkit/audio_tools_srv',
  serviceType: 'robot_toolkit_msgs/audio_tools_srv',
});

const motion = new Service({
  ros,
  name: '/robot_toolkit/motion_tools_srv',
  serviceType: 'robot_toolkit_msgs/motion_tools_srv',
});

const misc = new Service({
  ros,
  name: '/robot_toolkit/misc_tools_srv',
  serviceType: 'robot_toolkit_msgs/misc_tools_srv',
});

const speechRecognition = new Service({
  ros,
  name: '/robot_toolkit/speech_recognition_srv',
  serviceType: 'robot_toolkit_msgs/speech_recognition_srv',
});

// Every request is {data: {...}} (except speech_recognition_srv).
// The error callback receives a string when the service call fails;
// an "ERROR: ..." reply from the toolkit arrives in the SUCCESS callback as result.
navigation.callService(
  { data: { command: 'enable_all' } },
  (result) => console.log('navigation:', result.result),
  (error) => console.error('navigation call failed:', error),
);

// Custom navigation configuration (note the exact field spelling "suscriber").
navigation.callService(
  {
    data: {
      command: 'custom',
      tf_enable: true, tf_frequency: 50,
      odom_enable: true, odom_frequency: 10,
      laser_enable: true, laser_frequency: 10,
      cmd_vel_enable: true, security_timer: 1,   // whole seconds; <= 0 disables the watchdog
      move_base_enable: false,
      goal_enable: false,
      robot_pose_suscriber_enable: false,
      path_enable: false, path_frequency: 10,
      robot_pose_publisher_enable: false, robot_pose_publisher_frequency: 10,
      result_enable: false,
      depth_to_laser_enable: false,
      free_zone_enable: false,
    },
  },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

// Cameras and face detection
vision.callService(
  { data: { camera_name: 'front_camera', command: 'enable' } },
  (result) => console.log(result.result, result.camera_parameters),
  (error) => console.error(error),
);

vision.callService(
  { data: { camera_name: 'front_camera', command: 'custom', resolution: 2, frame_rate: 15, color_space: 11 } },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

vision.callService(
  { data: { camera_name: 'front_camera_face_detector', command: 'enable' } },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

// Enable JPEG compression on a camera (data becomes a base64 JPEG; encoding "compressed bgr8").
vision.callService(
  {
    data: {
      camera_name: 'front_camera',
      command: 'set_parameters',
      camera_parameters: {
        brightness: 55, contrast: 32, saturation: 128, hue: 0,
        horizontal_flip: false, vertical_flip: false,
        auto_exposition: true, auto_white_balance: true, auto_gain: true,
        gain: 32, exposure: 0, reset_camera_registers: false,
        blc_red_value: 0, blc_green_value: 0, blc_blue_value: 0,
        resolution: 0, fps: 0, average_luminance: 0,
        auto_focus: false, compress: true, compression_factor: 80,
      },
    },
  },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

// Audio: TTS, microphone, localisation, speech parameters
audio.callService(
  { data: { command: 'enable_tts' } },
  (result) => console.log(result.result, result.speech_parameters),
  (error) => console.error(error),
);

audio.callService(
  { data: { command: 'custom', frequency: 16000, channels: 0 } },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

audio.callService(
  {
    data: {
      command: 'set_speech_params',
      speech_parameters: {
        pitch_shift: 1.2, double_voice: 0, double_voice_level: 0,
        double_voice_time_shift: 0, speed: 100,
      },
    },
  },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

// Motion and misc
motion.callService(
  { data: { command: 'custom', animation: 'enable', set_angles: 'enable' } },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

misc.callService(
  { data: { command: 'custom', leds: 'enable', sonars: 'enable', touch: 'enable' } },
  (result) => console.log(result.result),
  (error) => console.error(error),
);

// Blocking speech recognition: returns when a word is heard (no server-side timeout).
speechRecognition.callService(
  { words: ['yes', 'no', 'maybe'], threshold: 0.4 },
  (result) => console.log('Heard:', result.result),   // "NONE" if below threshold
  (error) => console.error(error),
);
```

Services of the Python node (`py_toolkit`, Section 8) use the same pattern; ready-made examples are in Section 8.8.

### 12.3 Publishing to topics

```javascript
// Velocity: publish repeatedly, the watchdog stops the robot ~0.5 s after the last message.
const cmdVel = new Topic({ ros, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });

let driveTimer = null;
function drive(x, y, theta) {
  const twist = {
    linear: { x, y, z: 0 },
    angular: { x: 0, y: 0, z: theta },
  };
  cmdVel.publish(twist);
  clearInterval(driveTimer);
  driveTimer = setInterval(() => cmdVel.publish(twist), 100);   // 10 Hz
}
function stop() {
  clearInterval(driveTimer);
  cmdVel.publish({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } });
}

// Short move relative to the robot
const moveTo = new Topic({ ros, name: '/move_base_simple/goal', messageType: 'geometry_msgs/PoseStamped' });
moveTo.publish({
  header: { frame_id: 'base_footprint' },
  pose: { position: { x: 0.5, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
});

// Planner goal / initial pose / free zone
const navGoal = new Topic({ ros, name: '/navigation/goal', messageType: 'geometry_msgs/Pose2D' });
navGoal.publish({ x: 1.0, y: 0.5, theta: 0.0 });

const setPose = new Topic({ ros, name: '/navigation/robot_pose_subscriber', messageType: 'geometry_msgs/Pose2D' });
setPose.publish({ x: 0, y: 0, theta: 0 });

const freeZone = new Topic({ ros, name: '/free_zone', messageType: 'geometry_msgs/Vector3' });
freeZone.publish({ x: 0.8, y: 1.0, z: 0 });      // x: radius, y: displacement constraint

// Speech
const speech = new Topic({ ros, name: '/speech', messageType: 'robot_toolkit_msgs/speech_msg' });
speech.publish({ text: 'Hello, I am Pepper', language: 'English', animated: true });

// Animation: "family" is required
const animations = new Topic({ ros, name: '/animations', messageType: 'robot_toolkit_msgs/animation_msg' });
animations.publish({ family: 'animations', animation_name: 'Gestures/Hey_1' });

// Joint angles (arrays must have equal length)
const setAngles = new Topic({ ros, name: '/set_angles', messageType: 'robot_toolkit_msgs/set_angles_msg' });
setAngles.publish({
  names: ['HeadYaw', 'HeadPitch'],
  angles: [0.5, -0.2],
  fraction_max_speed: [0.2, 0.2],
});

// LEDs
const leds = new Topic({ ros, name: '/leds', messageType: 'robot_toolkit_msgs/leds_parameters_msg' });
leds.publish({ name: 'FaceLeds', red: 0, green: 255, blue: 0, time: 1 });

// Special settings
const special = new Topic({ ros, name: '/special_settings', messageType: 'robot_toolkit_msgs/special_settings_msg' });
special.publish({ command: 'rest', state: true, data: 0 });
special.publish({ command: 'set_security_distance', state: false, data: 0.3 });
```

### 12.4 Subscribing to topics

```javascript
// Odometry (use '/odom_wheels' when the node was started with --publish_odom false)
new Topic({ ros, name: '/odom', messageType: 'nav_msgs/Odometry' }).subscribe((msg) => {
  const p = msg.pose.pose.position;
  console.log(`x=${p.x.toFixed(2)} y=${p.y.toFixed(2)} vx=${msg.twist.twist.linear.x}`);
});

// Laser: 61 beams, -1 marks gaps between the three laser units
new Topic({ ros, name: '/laser', messageType: 'sensor_msgs/LaserScan' }).subscribe((scan) => {
  let min = Infinity, at = 0;
  scan.ranges.forEach((r, i) => { if (r > scan.range_min && r < min) { min = r; at = scan.angle_min + i * scan.angle_increment; } });
  console.log(`closest ${min.toFixed(2)} m at ${at.toFixed(2)} rad`);
});

// Camera: over rosbridge a uint8[] arrives as a base64 string.
// Throttle and keep one message queued to avoid flooding the websocket.
const camera = new Topic({
  ros,
  name: `${NODE}/camera/front/image_raw`,
  messageType: 'sensor_msgs/Image',
  throttle_rate: 200,
  queue_length: 1,
});
camera.subscribe((img) => {
  const canvas = document.getElementById('cam');
  if (img.encoding === 'compressed bgr8') {
    // set_parameters compress:true -> data is a base64 JPEG
    const el = new Image();
    el.onload = () => { canvas.width = el.width; canvas.height = el.height; canvas.getContext('2d').drawImage(el, 0, 0); };
    el.src = `data:image/jpeg;base64,${img.data}`;
  } else if (img.encoding === 'rgb8') {
    const raw = Uint8Array.from(atob(img.data), (c) => c.charCodeAt(0));
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    const out = ctx.createImageData(img.width, img.height);
    for (let i = 0, j = 0; i < raw.length; i += 3, j += 4) {
      out.data[j] = raw[i]; out.data[j + 1] = raw[i + 1]; out.data[j + 2] = raw[i + 2]; out.data[j + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  }
});

// Faces: each face is a cropped Image; points[i] is its top-left pixel in the source frame
new Topic({ ros, name: '/face_publisher/front_camera', messageType: 'robot_toolkit_msgs/face_detection_msg' })
  .subscribe((msg) => msg.faces.forEach((face, i) =>
    console.log(`face ${i}: ${face.width}x${face.height} at (${msg.points[i].x}, ${msg.points[i].y})`)));

// Audio localisation (note "confidendce")
new Topic({ ros, name: '/audio_localization', messageType: 'robot_toolkit_msgs/audio_localization_msg' })
  .subscribe((m) => console.log(`azimuth ${m.azimuth} elevation ${m.elevation} confidence ${m.confidendce} energy ${m.energy}`));

// Microphone buffer
new Topic({ ros, name: '/mic', messageType: 'naoqi_bridge_msgs/AudioBuffer' })
  .subscribe((buf) => console.log(`${buf.data.length} samples, channelMap ${buf.channelMap}`));

// Sonar
['front', 'back'].forEach((side) =>
  new Topic({ ros, name: `/sonar/${side}`, messageType: 'sensor_msgs/Range' })
    .subscribe((r) => console.log(`${side}: ${r.range} m`)));

// Touch
new Topic({ ros, name: '/touch', messageType: 'robot_toolkit_msgs/touch_msg' })
  .subscribe((t) => console.log(`${t.name}: ${t.state ? 'pressed' : 'released'}`));

// Navigation feedback
new Topic({ ros, name: '/navigation/result', messageType: 'std_msgs/String' })
  .subscribe((m) => console.log('planner result:', m.data));

new Topic({ ros, name: '/navigation/path', messageType: 'robot_toolkit_msgs/path_msg' })
  .subscribe((m) => console.log(`path with ${m.point_world.length} points`));

new Topic({ ros, name: '/navigation/robot_pose_publisher', messageType: 'geometry_msgs/Vector3' })
  .subscribe((p) => console.log(`pose x=${p.x} y=${p.y} heading=${p.z}`));

new Topic({ ros, name: '/free_zone/result', messageType: 'geometry_msgs/Pose2D' })
  .subscribe((p) => console.log(`free zone centre in robot frame: ${p.x}, ${p.y}`));
```

### 12.5 Typical start-up sequence

```javascript
// Enable what the UI needs, then start publishing/subscribing.
navigation.callService({ data: { command: 'enable_all' } },
  () => audio.callService({ data: { command: 'enable' } },
    () => motion.callService({ data: { command: 'enable_all' } },
      () => misc.callService({ data: { command: 'enable_all' } },
        () => console.log('Pepper toolkit ready'),
        (e) => console.error(e)),
      (e) => console.error(e)),
    (e) => console.error(e)),
  (e) => console.error(e));
```

> There are no ROS actions in this toolkit, so there is no `ActionClient` example. Goals are sent with `/navigation/goal` and tracked with `/navigation/result` (section 12.4).
