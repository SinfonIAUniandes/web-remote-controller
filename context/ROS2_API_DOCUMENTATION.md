# Sinfonia Robot Toolkit - ROS 2 API Documentation

**Package Name:** `robot_toolkit`  
**Version:** 0.0.0  
**Robot Platform:** Pepper (humanoid robot by SoftBank Robotics)  
**Maintained by:** SinfonIA RoboCup Team - Colombia

---

## Table of Contents

1. [Overview](#overview)
2. [Topics](#topics)
   - [Published Topics](#published-topics)
   - [Subscribed Topics](#subscribed-topics)
3. [Services](#services)
4. [ROS 2 Parameters](#ros-2-parameters)
5. [Message Definitions](#message-definitions)
6. [Usage Examples](#usage-examples)
   - [ROS 2 CLI Examples](#ros-2-cli-examples)
   - [JavaScript/roslibjs Examples](#javascriptroslibjs-examples)

---

## Overview

The `robot_toolkit` is a comprehensive ROS interface for the Pepper robot, providing control and monitoring of:
- **Navigation**: velocity commands, odometry, laser scanning, transforms
- **Vision**: front/bottom/depth cameras, face detection
- **Audio**: microphone stream, text-to-speech, speech recognition, audio localization
- **Motion**: animations, joint angle control
- **Misc**: LEDs, touch sensors, sonar distance sensors, special settings

### Key Features
- Dynamic topic enable/disable via services
- Configurable publishing frequencies
- Face detection and tracking
- Real-time audio stream processing
- Complete transform chain (`tf2`)
- Navigation path and goal support

---

## Topics

### Published Topics

#### Navigation Topics

##### `/tf`
**Message Type:** `tf2_msgs/msg/TFMessage`  
**Frequency:** 50 Hz (configurable)  
**Direction:** Pub  

**Description:** Transform frames for the robot's kinematic chain, including base_link, odom, camera frames, and joint frames.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| transforms | TransformStamped[] | Array of transform frames |
| transforms[].header.frame_id | string | Parent frame (e.g., "odom") |
| transforms[].child_frame_id | string | Child frame (e.g., "base_link") |
| transforms[].transform.translation | geometry_msgs/Vector3 | Position (x, y, z in meters) |
| transforms[].transform.rotation | geometry_msgs/Quaternion | Orientation (qx, qy, qz, qw) |

---

##### `/odom` or `/odom_wheels`
**Message Type:** `nav_msgs/msg/Odometry`  
**Frequency:** 10 Hz (configurable)  
**Direction:** Pub  

**Description:** Robot odometry based on wheel encoders. Topic name depends on launch configuration (`publish_odom` flag).

**Key Fields:**
| Field | Type | Units | Description |
|-------|------|-------|-------------|
| header.frame_id | string | — | Usually "odom" |
| child_frame_id | string | — | Usually "base_link" |
| pose.pose.position.x | float64 | m | X position in odometry frame |
| pose.pose.position.y | float64 | m | Y position in odometry frame |
| pose.pose.position.z | float64 | m | Z position (typically 0) |
| pose.pose.orientation | Quaternion | — | Robot yaw orientation |
| twist.twist.linear.x | float64 | m/s | Linear velocity in X |
| twist.twist.linear.y | float64 | m/s | Linear velocity in Y |
| twist.twist.angular.z | float64 | rad/s | Angular velocity around Z |

---

##### `/laser`
**Message Type:** `sensor_msgs/msg/LaserScan`  
**Frequency:** 10 Hz (configurable)  
**Direction:** Pub  

**Description:** 2D laser scan from the robot's front laser scanner.

**Key Fields:**
| Field | Type | Units | Range |
|-------|------|-------|-------|
| angle_min | float32 | rad | Typically -1.57 |
| angle_max | float32 | rad | Typically 1.57 |
| angle_increment | float32 | rad | Angular resolution |
| range_min | float32 | m | Minimum detection distance (≈0.1) |
| range_max | float32 | m | Maximum detection distance (≈5.0) |
| ranges[] | float32[] | m | Distance measurements at each angle |
| intensities[] | float32[] | — | Intensity values (if available) |

---

##### `/merged_laser`
**Message Type:** `sensor_msgs/msg/LaserScan`  
**Frequency:** 10 Hz (configurable)  
**Direction:** Pub  

**Description:** Merged laser scan combining multiple laser sources for better coverage.

**Key Fields:** Same as `/laser`

---

##### `/depth_to_laser`
**Message Type:** `sensor_msgs/msg/LaserScan`  
**Frequency:** 10 Hz (configurable, configurable via service)  
**Direction:** Pub  

**Description:** 2D laser scan synthesized from the depth camera. Useful when front laser is unavailable.

**Key Fields:** Same as `/laser`

**Configuration Parameters:**
- `resolution`: Depth image resolution (kQVGA, kVGA, etc.)
- `scan_time`: Time for each scan (seconds)
- `range_min`: Minimum detection range (meters)
- `range_max`: Maximum detection range (meters)
- `scan_height`: Number of depth rows used for laser profile

---

#### Vision Topics

##### `/camera/front/image_raw`
**Message Type:** `sensor_msgs/msg/Image`  
**Frequency:** 10 Hz (configurable)  
**Direction:** Pub  

**Description:** Raw RGB image from the top (front-facing) camera.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| header.frame_id | string | "camera_top_optical_frame" |
| height | uint32 | Image height in pixels (default: 480 for QVGA) |
| width | uint32 | Image width in pixels (default: 640 for QVGA) |
| encoding | string | "rgb8" or "bgr8" depending on color space |
| data | uint8[] | Raw image pixel data |
| step | uint32 | Full row length in bytes |

---

##### `/camera/bottom/image_raw`
**Message Type:** `sensor_msgs/msg/Image`  
**Frequency:** 10 Hz (configurable)  
**Direction:** Pub  

**Description:** Raw RGB image from the bottom (downward-facing) camera.

**Key Fields:** Same as `/camera/front/image_raw`

---

##### `/camera/depth/image_raw`
**Message Type:** `sensor_msgs/msg/Image`  
**Frequency:** 10 Hz (configurable)  
**Direction:** Pub  

**Description:** Raw depth image from the RGB-D camera. Each pixel contains distance in millimeters.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| header.frame_id | string | "camera_depth_optical_frame" |
| height | uint32 | Image height in pixels |
| width | uint32 | Image width in pixels |
| encoding | string | "16UC1" (16-bit unsigned, 1 channel) |
| data | uint8[] | Raw depth data (millimeters as uint16) |

---

##### `/face_publisher/front_camera`
**Message Type:** `robot_toolkit_msgs/msg/Faces` (custom)  
**Frequency:** 30 Hz (configurable)  
**Direction:** Pub  

**Description:** Face detection results from the front camera, including bounding boxes and face IDs.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| faces[] | Face[] | Array of detected faces |
| faces[].id | int32 | Face ID (for tracking) |
| faces[].alpha | float32 | Face angle (0-360 degrees) |
| faces[].beta | float32 | Vertical angle |
| faces[].size_x | float32 | Bounding box width (normalized 0-1) |
| faces[].size_y | float32 | Bounding box height (normalized 0-1) |
| faces[].center_x | float32 | Bounding box center X (normalized) |
| faces[].center_y | float32 | Bounding box center Y (normalized) |

---

##### `/face_publisher/bottom_camera`
**Message Type:** `robot_toolkit_msgs/msg/Faces` (custom)  
**Frequency:** 30 Hz (configurable)  
**Direction:** Pub  

**Description:** Face detection results from the bottom camera.

**Key Fields:** Same as `/face_publisher/front_camera`

---

#### Audio Topics

##### `/microphone/audio`
**Message Type:** `sensor_msgs/msg/Image` (raw audio as image container)  
**Frequency:** Variable (depends on sample rate)  
**Direction:** Pub  

**Description:** Microphone audio stream with configurable sample rate and channel count.

**Configuration Parameters:**
- `frequency`: Sample rate (48000 Hz or 16000 Hz)
- `channels`: Number of audio channels (0-4, typically 4 for array microphone)

**Usage Notes:**
- Data is published as audio frames with configurable frequency and channel configuration
- 4-channel array allows for audio source localization

---

##### `/microphone/localization`
**Message Type:** `robot_toolkit_msgs/msg/AudioLocalization` (custom)  
**Frequency:** Variable  
**Direction:** Pub  

**Description:** Audio source localization angles and confidence scores from the microphone array.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| azimuth | float32 | Horizontal angle to sound source (0-360 degrees) |
| elevation | float32 | Vertical angle to sound source |
| confidence | float32 | Confidence score (0.0-1.0) |
| is_valid | bool | Whether the localization is valid |

---

#### Navigation Topics

##### `/navigation/path`
**Message Type:** `nav_msgs/msg/Path`  
**Frequency:** 10 Hz (when navigation is active)  
**Direction:** Pub  

**Description:** Planned navigation path from current pose to goal pose.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| header.frame_id | string | Usually "odom" or "map" |
| poses[] | PoseStamped[] | Array of waypoints |
| poses[].pose.position | Point | Waypoint position (x, y, z) |
| poses[].pose.orientation | Quaternion | Waypoint orientation |

---

##### `/navigation/robot_pose_publisher`
**Message Type:** `geometry_msgs/msg/PoseStamped`  
**Frequency:** 10 Hz (when navigation is active)  
**Direction:** Pub  

**Description:** Robot's current pose as estimated by the navigation system (may differ from odometry).

**Key Fields:**
| Field | Type | Units |
|-------|------|-------|
| header.frame_id | string | "map" or "odom" |
| pose.position.x | float64 | m |
| pose.position.y | float64 | m |
| pose.position.z | float64 | m |
| pose.orientation | Quaternion | — |

---

#### Misc Topics

##### `/sonar/front`
**Message Type:** `sensor_msgs/msg/Range`  
**Frequency:** 50 Hz (configurable)  
**Direction:** Pub  

**Description:** Distance measurement from the front sonar sensor.

**Key Fields:**
| Field | Type | Units | Range |
|-------|------|-------|-------|
| header.frame_id | string | — | "sonar_front" |
| radiation_type | uint8 | — | ULTRASOUND (2) |
| min_range | float32 | m | Typically 0.1 |
| max_range | float32 | m | Typically 0.8 |
| range | float32 | m | Current distance |

---

##### `/sonar/back`
**Message Type:** `sensor_msgs/msg/Range`  
**Frequency:** 50 Hz (configurable)  
**Direction:** Pub  

**Description:** Distance measurement from the rear sonar sensor.

**Key Fields:** Same as `/sonar/front`

---

##### `/touch`
**Message Type:** `robot_toolkit_msgs/msg/Touch` (custom)  
**Frequency:** Event-driven  
**Direction:** Pub  

**Description:** Touch sensor events from the robot's head and bumpers.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| touch_type | string | "head_front", "head_middle", "head_rear" |
| touched | bool | True if sensor is being touched |
| timestamp | float64 | Event timestamp (seconds) |

---

### Subscribed Topics

#### Motion Control

##### `/cmd_vel`
**Message Type:** `geometry_msgs/msg/Twist`  
**Direction:** Sub  
**Latency Requirement:** Real-time (should respond within 100ms)  

**Description:** Velocity command for robot locomotion. Controls forward/backward, lateral strafe, and rotation.

**Key Fields:**
| Field | Type | Units | Valid Range |
|-------|------|-------|-------------|
| linear.x | float64 | m/s | -1.0 to 1.0 |
| linear.y | float64 | m/s | -1.0 to 1.0 |
| linear.z | float64 | m/s | 0 (not used) |
| angular.x | float64 | rad/s | 0 (not used) |
| angular.y | float64 | rad/s | 0 (not used) |
| angular.z | float64 | rad/s | -1.0 to 1.0 |

**Safety Features:**
- Security timeout: 0.5 seconds (configurable) — robot stops if no cmd_vel received
- Can be disabled by setting security_timer to -1

**ROS 2 CLI Example:**
```bash
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist \
  "{linear: {x: 0.5, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}"
```

---

##### `/animations`
**Message Type:** `robot_toolkit_msgs/msg/AnimationMsg` (custom)  
**Direction:** Sub  

**Description:** Trigger pre-loaded animations by name or play custom animation from file.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| animation_name | string | Name of the animation (e.g., "Wave", "Dance") |
| animation_path | string | Path to animation file (optional) |
| speed_percent | float32 | Animation playback speed (50-150) |
| loop | bool | Whether to loop the animation |

---

##### `/set_angles`
**Message Type:** `robot_toolkit_msgs/msg/SetAngles` (custom)  
**Direction:** Sub  

**Description:** Set joint angles for specific robot joints.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| joint_names[] | string[] | Joint names (e.g., ["HeadYaw", "HeadPitch"]) |
| target_angles[] | float32[] | Target angles in radians |
| speed_percent | float32 | Motion speed (0-100) |

---

#### Speech & Audio

##### `/speech`
**Message Type:** `robot_toolkit_msgs/msg/SpeechMsg` (custom)  
**Direction:** Sub  

**Description:** Text-to-speech command. Robot will speak the provided text.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| text | string | Text to speak |
| language | string | Language code ("en", "es", "fr", etc.) |
| animated | bool | Whether to use animated speech (with gestures) |

**Speech Parameters (configurable):**
| Parameter | Range | Default |
|-----------|-------|---------|
| pitch_shift | 1.0-4.0 or 0.0 | 1.0 |
| speed | 50-400 (words/min) | 150 |
| double_voice | 1.0-4.0 or 0.0 | 1.0 |
| double_voice_level | 0.0-4.0 | 0.0 |
| double_voice_time_shift | 0.0-0.5 (seconds) | 0.0 |

---

#### LED Control

##### `/leds`
**Message Type:** `robot_toolkit_msgs/msg/Leds` (custom)  
**Direction:** Sub  

**Description:** Control robot LED colors and intensity.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| led_name | string | LED group (e.g., "face_led", "chest_led", "feet_led") |
| red | uint8 | Red intensity (0-255) |
| green | uint8 | Green intensity (0-255) |
| blue | uint8 | Blue intensity (0-255) |
| intensity | float32 | Overall intensity (0.0-1.0) |
| duration | float32 | Duration in seconds (0 = indefinite) |

---

#### Navigation Goals

##### `/move_base_simple/goal`
**Message Type:** `geometry_msgs/msg/PoseStamped`  
**Direction:** Sub  

**Description:** Simple goal for move_base navigation (legacy compatibility).

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| header.frame_id | string | "map" or "odom" |
| pose.position.x | float64 | Goal X coordinate (meters) |
| pose.position.y | float64 | Goal Y coordinate (meters) |
| pose.orientation | Quaternion | Goal orientation |

---

##### `/navigation/goal`
**Message Type:** `geometry_msgs/msg/PoseStamped`  
**Direction:** Sub  

**Description:** Navigation goal for the robot (preferred over move_base_simple/goal).

**Key Fields:** Same as `/move_base_simple/goal`

---

##### `/navigation/robot_pose_subscriber`
**Message Type:** `geometry_msgs/msg/PoseStamped`  
**Direction:** Sub  

**Description:** External robot pose subscription (e.g., from motion capture or SLAM).

**Key Fields:** Same as `/move_base_simple/goal`

---

##### `/free_zone`
**Message Type:** `robot_toolkit_msgs/msg/FreeZone` (custom)  
**Direction:** Sub  

**Description:** Define navigation-free zones (obstacles) for path planning.

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| obstacles[] | Polygon[] | Array of obstacle polygons |
| obstacles[].points[] | Point32[] | Vertices of each polygon |

---

#### Special Settings

##### `/special_settings`
**Message Type:** `robot_toolkit_msgs/msg/SpecialSettings` (custom)  
**Direction:** Sub  

**Description:** Configure special settings for the robot behavior.

**Key Fields:** (Varies based on robot capabilities)

---

## Services

### Navigation Tools Service

**Service Name:** `/robot_toolkit/navigation_tools_srv`  
**Service Type:** `robot_toolkit_msgs/srv/NavigationToolsSrv`  

**Description:** Control navigation-related converters and subscribers (tf, odometry, laser, cmd_vel, etc.).

#### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| data.command | string | Command to execute |
| data.tf_enable | bool | Enable/disable tf publishing |
| data.tf_frequency | float | TF publishing frequency (Hz) |
| data.odom_enable | bool | Enable/disable odometry |
| data.odom_frequency | float | Odometry frequency (Hz) |
| data.laser_enable | bool | Enable/disable laser scan |
| data.laser_frequency | float | Laser frequency (Hz) |
| data.goal_enable | bool | Enable/disable navigation goals |
| data.robot_pose_subscriber_enable | bool | Enable/disable robot pose input |
| data.path_enable | bool | Enable/disable path publishing |
| data.path_frequency | float | Path frequency (Hz) |
| data.robot_pose_publisher_enable | bool | Enable/disable pose publishing |
| data.robot_pose_publisher_frequency | float | Pose frequency (Hz) |
| data.result_enable | bool | Enable/disable navigation result events |
| data.depth_to_laser_enable | bool | Enable/disable depth-to-laser conversion |
| data.depth_to_laser_parameters | DepthToLaserParams | Depth conversion configuration |
| data.cmd_vel_enable | bool | Enable/disable cmd_vel subscription |
| data.security_timer | float | Cmd_vel security timeout (seconds, -1 to disable) |
| data.move_base_enable | bool | Enable/disable move_base goal subscription |
| data.free_zone_enable | bool | Enable/disable free zone subscription |

#### Commands

| Command | Description | Effect |
|---------|-------------|--------|
| `enable_mapper` | Start SLAM/mapping mode | Enables tf, laser, depth_to_laser, odom, merged_laser |
| `disable_mapper` | Stop mapping | Disables all mapping converters |
| `enable_navigate` | Start autonomous navigation | Enables navigation path, goals, result feedback |
| `disable_navigate` | Stop navigation | Disables navigation converters |
| `enable_all` | Enable all navigation features | Full suite of navigation converters |
| `disable_all` | Disable all navigation | Stops all converters and subscribers |
| `custom` | Custom configuration | Selectively enable/disable individual components |

#### Response

| Field | Type | Description |
|-------|------|-------------|
| result | string | Status message ("Functionalities started: ...") |

#### ROS 2 CLI Example

```bash
# Enable SLAM/mapping mode
ros2 service call /robot_toolkit/navigation_tools_srv robot_toolkit_msgs/srv/NavigationToolsSrv \
  "{data: {command: 'enable_mapper'}}"

# Custom configuration: enable tf at 50Hz and cmd_vel with 0.5s timeout
ros2 service call /robot_toolkit/navigation_tools_srv robot_toolkit_msgs/srv/NavigationToolsSrv \
  "{data: {
    command: 'custom',
    tf_enable: true,
    tf_frequency: 50.0,
    cmd_vel_enable: true,
    security_timer: 0.5
  }}"

# Enable autonomous navigation
ros2 service call /robot_toolkit/navigation_tools_srv robot_toolkit_msgs/srv/NavigationToolsSrv \
  "{data: {command: 'enable_navigate'}}"

# Disable all navigation
ros2 service call /robot_toolkit/navigation_tools_srv robot_toolkit_msgs/srv/NavigationToolsSrv \
  "{data: {command: 'disable_all'}}"
```

---

### Vision Tools Service

**Service Name:** `/robot_toolkit/vision_tools_srv`  
**Service Type:** `robot_toolkit_msgs/srv/VisionToolsSrv`  

**Description:** Control camera publishers and face detectors with dynamic reconfiguration.

#### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| data.command | string | "enable", "disable", "custom", "set_parameters", "get_parameters" |
| data.camera_name | string | "front_camera", "bottom_camera", "depth_camera", "front_camera_face_detector", "bottom_camera_face_detector" |
| data.resolution | int | Camera resolution (kQQQQVGA=0, kQQQVGA=1, ..., kVGA=5, k4VGA=6, k16VGA=7) |
| data.frame_rate | int | Frame rate in Hz (1-30 for RGB, 1-20 for depth) |
| data.color_space | int | Color space (kRGBColorSpace=0, kHSMixedColorSpace=10, etc.) |
| data.camera_parameters | CameraParametersMsg | Camera intrinsic and control parameters |

#### Camera Resolutions

| Enum Value | Name | Resolution |
|-----------|------|-----------|
| 0 | kQQQQVGA | 80×60 |
| 1 | kQQQVGA | 160×120 |
| 2 | kQQVGA | 320×240 |
| 3 | kQVGA | 640×480 |
| 4 | kVGA | 1280×960 |
| 5 | k4VGA | 2560×1920 (RGB only, 1 fps) |
| 6 | k16VGA | 5120×3840 (RGB only, 1 fps) |

#### Camera Parameters

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| brightness | float | 0.0-1.0 | Image brightness |
| contrast | float | 0.0-1.0 | Image contrast |
| saturation | float | 0.0-1.0 | Color saturation |
| hue | float | 0.0-1.0 | Color hue shift |
| horizontal_flip | bool | — | Flip image horizontally |
| vertical_flip | bool | — | Flip image vertically |
| auto_exposition | bool | — | Automatic exposure control |
| auto_white_balance | bool | — | Automatic white balance |
| auto_gain | bool | — | Automatic gain control |
| gain | float | 0.0-1.0 | Manual gain level |
| exposure | float | 0.0-1.0 | Manual exposure |
| auto_focus | bool | — | Automatic focus |
| compress | bool | — | JPEG compression enabled |
| compression_factor | float | 0.0-1.0 | Compression quality |

#### ROS 2 CLI Example

```bash
# Enable front camera with default parameters
ros2 service call /robot_toolkit/vision_tools_srv robot_toolkit_msgs/srv/VisionToolsSrv \
  "{data: {command: 'enable', camera_name: 'front_camera'}}"

# Configure front camera with custom resolution and frame rate
ros2 service call /robot_toolkit/vision_tools_srv robot_toolkit_msgs/srv/VisionToolsSrv \
  "{data: {
    command: 'custom',
    camera_name: 'front_camera',
    resolution: 3,
    frame_rate: 15,
    color_space: 0
  }}"

# Enable face detection from front camera
ros2 service call /robot_toolkit/vision_tools_srv robot_toolkit_msgs/srv/VisionToolsSrv \
  "{data: {command: 'enable', camera_name: 'front_camera_face_detector'}}"

# Disable depth camera
ros2 service call /robot_toolkit/vision_tools_srv robot_toolkit_msgs/srv/VisionToolsSrv \
  "{data: {command: 'disable', camera_name: 'depth_camera'}}"

# Get current camera parameters
ros2 service call /robot_toolkit/vision_tools_srv robot_toolkit_msgs/srv/VisionToolsSrv \
  "{data: {command: 'get_parameters', camera_name: 'front_camera'}}"
```

---

### Audio Tools Service

**Service Name:** `/robot_toolkit/audio_tools_srv`  
**Service Type:** `robot_toolkit_msgs/srv/AudioToolsSrv`  

**Description:** Control microphone stream, text-to-speech, and audio localization.

#### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| data.command | string | "enable", "disable", "custom", "enable_mic", "disable_mic", "enable_tts", "disable_tts", "enable_localization", "disable_localization", "get_speech_params", "set_speech_params", "reset_speech_params" |
| data.frequency | int | Mic sample rate: 48000 or 16000 Hz |
| data.channels | int | Number of mic channels: 0-4 (4 is array microphone) |
| data.speech_parameters | SpeechParametersMsg | TTS parameters |

#### Commands

| Command | Description |
|---------|-------------|
| `enable` / `disable` | Start/stop all audio (mic + TTS + localization) |
| `enable_mic` / `disable_mic` | Start/stop microphone stream only |
| `enable_tts` / `disable_tts` | Start/stop text-to-speech |
| `enable_localization` / `disable_localization` | Start/stop audio source localization |
| `custom` | Configure mic with custom sample rate and channels |
| `get_speech_params` | Retrieve current TTS parameters |
| `set_speech_params` | Update TTS parameters (with validation) |
| `reset_speech_params` | Reset TTS parameters to defaults |

#### ROS 2 CLI Example

```bash
# Enable microphone with 16 kHz sample rate, 4 channels
ros2 service call /robot_toolkit/audio_tools_srv robot_toolkit_msgs/srv/AudioToolsSrv \
  "{data: {
    command: 'custom',
    frequency: 16000,
    channels: 4
  }}"

# Enable text-to-speech
ros2 service call /robot_toolkit/audio_tools_srv robot_toolkit_msgs/srv/AudioToolsSrv \
  "{data: {command: 'enable_tts'}}"

# Disable microphone
ros2 service call /robot_toolkit/audio_tools_srv robot_toolkit_msgs/srv/AudioToolsSrv \
  "{data: {command: 'disable_mic'}}"

# Enable audio source localization
ros2 service call /robot_toolkit/audio_tools_srv robot_toolkit_msgs/srv/AudioToolsSrv \
  "{data: {command: 'enable_localization'}}"

# Set speech parameters (pitch, speed, etc.)
ros2 service call /robot_toolkit/audio_tools_srv robot_toolkit_msgs/srv/AudioToolsSrv \
  "{data: {
    command: 'set_speech_params',
    speech_parameters: {
      pitch_shift: 1.5,
      speed: 200.0,
      double_voice: 1.0,
      double_voice_level: 0.0,
      double_voice_time_shift: 0.0
    }
  }}"
```

---

### Motion Tools Service

**Service Name:** `/robot_toolkit/motion_tools_srv`  
**Service Type:** `robot_toolkit_msgs/srv/MotionToolsSrv`  

**Description:** Enable/disable animation and joint angle control subscribers.

#### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| data.command | string | "enable_all", "disable_all", "custom" |
| data.animation | string | "enable" or "disable" |
| data.set_angles | string | "enable" or "disable" |

#### Commands

| Command | Description |
|---------|-------------|
| `enable_all` | Enable both animations and set_angles |
| `disable_all` | Disable both animations and set_angles |
| `custom` | Selectively enable/disable animations and joint control |

#### ROS 2 CLI Example

```bash
# Enable all motion features
ros2 service call /robot_toolkit/motion_tools_srv robot_toolkit_msgs/srv/MotionToolsSrv \
  "{data: {command: 'enable_all'}}"

# Custom: enable animations but disable set_angles
ros2 service call /robot_toolkit/motion_tools_srv robot_toolkit_msgs/srv/MotionToolsSrv \
  "{data: {
    command: 'custom',
    animation: 'enable',
    set_angles: 'disable'
  }}"

# Disable all motion features
ros2 service call /robot_toolkit/motion_tools_srv robot_toolkit_msgs/srv/MotionToolsSrv \
  "{data: {command: 'disable_all'}}"
```

---

### Misc Tools Service

**Service Name:** `/robot_toolkit/misc_tools_srv`  
**Service Type:** `robot_toolkit_msgs/srv/MiscToolsSrv`  

**Description:** Control LEDs, sonar, and touch sensors.

#### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| data.command | string | "enable_all", "disable_all", "custom" |
| data.leds | string | "enable" or "disable" |
| data.sonars | string | "enable" or "disable" |
| data.touch | string | "enable" or "disable" |

#### ROS 2 CLI Example

```bash
# Enable all misc features (LEDs, sonar, touch)
ros2 service call /robot_toolkit/misc_tools_srv robot_toolkit_msgs/srv/MiscToolsSrv \
  "{data: {command: 'enable_all'}}"

# Custom: enable LEDs and sonar, but disable touch
ros2 service call /robot_toolkit/misc_tools_srv robot_toolkit_msgs/srv/MiscToolsSrv \
  "{data: {
    command: 'custom',
    leds: 'enable',
    sonars: 'enable',
    touch: 'disable'
  }}"

# Disable all
ros2 service call /robot_toolkit/misc_tools_srv robot_toolkit_msgs/srv/MiscToolsSrv \
  "{data: {command: 'disable_all'}}"
```

---

### Speech Recognition Service

**Service Name:** `/robot_toolkit/speech_recognition_srv`  
**Service Type:** `robot_toolkit_msgs/srv/SpeechRecognitionSrv`  

**Description:** Perform speech recognition with a predefined word list.

#### Request Parameters

| Field | Type | Description |
|-------|------|-------------|
| words | string[] | List of words to recognize |
| threshold | float | Confidence threshold (0.0-1.0) |

#### Response

| Field | Type | Description |
|-------|------|-------------|
| result | string | Recognized word or empty string if no match |

#### ROS 2 CLI Example

```bash
# Recognize spoken commands from a predefined list
ros2 service call /robot_toolkit/speech_recognition_srv \
  robot_toolkit_msgs/srv/SpeechRecognitionSrv \
  "{words: ['forward', 'backward', 'left', 'right'], threshold: 0.7}"
```

---

## ROS 2 Parameters

The robot_toolkit uses a hierarchical parameter structure accessible via the ROS parameter server.

### Core Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `~namespace` | string | "robot_toolkit_node" | Node namespace |
| `~network_interface` | string | "eth0" | Network interface for ROS communication |
| `~publish_odom` | bool | false | Publish wheel odometry instead of localized odometry |

### Topic Enable/Frequency Parameters

Parameters can be set dynamically to control publishing frequencies:

```bash
# Set converter frequency (Hz)
ros2 param set /robot_toolkit_node tf_frequency 50.0
ros2 param set /robot_toolkit_node laser_frequency 10.0
ros2 param set /robot_toolkit_node odom_frequency 10.0

# Enable/disable converters
ros2 param set /robot_toolkit_node tf_enabled true
ros2 param set /robot_toolkit_node laser_enabled true
```

---

## Message Definitions

### Custom Message Types

#### `robot_toolkit_msgs/msg/AnimationMsg`
```
string animation_name      # Name of animation to play
string animation_path      # Optional path to custom animation file
float32 speed_percent      # Playback speed (50-150%)
bool loop                  # Loop the animation
```

#### `robot_toolkit_msgs/msg/SetAngles`
```
string[] joint_names       # Names of joints to set
float32[] target_angles    # Target angles in radians
float32 speed_percent      # Motion speed (0-100%)
```

#### `robot_toolkit_msgs/msg/SpeechMsg`
```
string text                # Text to speak
string language            # Language code ("en", "es", "fr", etc.)
bool animated              # Use animated speech with gestures
```

#### `robot_toolkit_msgs/msg/Faces`
```
Face[] faces               # Array of detected faces

# Each Face contains:
int32 id                   # Face tracking ID
float32 alpha              # Horizontal angle (0-360 degrees)
float32 beta               # Vertical angle
float32 size_x             # Bounding box width (0-1)
float32 size_y             # Bounding box height (0-1)
float32 center_x           # Bounding box center X (0-1)
float32 center_y           # Bounding box center Y (0-1)
```

#### `robot_toolkit_msgs/msg/AudioLocalization`
```
float32 azimuth            # Horizontal angle to sound (0-360 degrees)
float32 elevation          # Vertical angle to sound
float32 confidence         # Confidence score (0.0-1.0)
bool is_valid              # Whether localization is valid
```

#### `robot_toolkit_msgs/msg/Touch`
```
string touch_type          # "head_front", "head_middle", "head_rear"
bool touched               # Touch state (true = touched)
float64 timestamp          # Event timestamp
```

#### `robot_toolkit_msgs/msg/Leds`
```
string led_name            # LED group name
uint8 red                  # Red intensity (0-255)
uint8 green                # Green intensity (0-255)
uint8 blue                 # Blue intensity (0-255)
float32 intensity          # Overall intensity (0.0-1.0)
float32 duration           # Duration in seconds (0 = indefinite)
```

---

## Usage Examples

### ROS 2 CLI Examples

#### Enable Navigation Stack
```bash
# Start mapping mode
ros2 service call /robot_toolkit/navigation_tools_srv \
  robot_toolkit_msgs/srv/NavigationToolsSrv \
  "{data: {command: 'enable_mapper'}}"
```

#### Send Velocity Commands
```bash
# Move forward at 0.5 m/s
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist \
  "{linear: {x: 0.5, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}"

# Rotate in place at 1.0 rad/s
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist \
  "{linear: {x: 0.0, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 1.0}}"

# Strafe (lateral movement) at 0.3 m/s
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist \
  "{linear: {x: 0.0, y: 0.3, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}"
```

#### Text-to-Speech
```bash
# Enable TTS first
ros2 service call /robot_toolkit/audio_tools_srv \
  robot_toolkit_msgs/srv/AudioToolsSrv \
  "{data: {command: 'enable_tts'}}"

# Publish speech message
ros2 topic pub /speech robot_toolkit_msgs/msg/SpeechMsg \
  "{text: 'Hello world', language: 'en', animated: true}"
```

#### Trigger Animation
```bash
# Enable animations first
ros2 service call /robot_toolkit/motion_tools_srv \
  robot_toolkit_msgs/srv/MotionToolsSrv \
  "{data: {command: 'enable_all'}}"

# Publish animation command
ros2 topic pub /animations robot_toolkit_msgs/msg/AnimationMsg \
  "{animation_name: 'Wave', speed_percent: 100.0, loop: false}"
```

#### Monitor Odometry
```bash
# Subscribe to odometry
ros2 topic echo /odom

# Record odometry to a ROS bag
ros2 bag record /odom /tf
```

---

### JavaScript/roslibjs Examples

> **⚠️ Note:** All examples use **roslibjs v2.1.0+** which removed `ServiceRequest`, `ServiceResponse`, and `Message` classes. Use plain JavaScript objects instead. See [roslibjs v2.1.0+ Migration Notes](#important-roslibjs-v210-migration-notes) below.

#### Initialize ROSLIB Connection
```javascript
// Connect to ROS bridge
const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
});

ros.on('connection', function() {
  console.log('Connected to ROS');
});

ros.on('error', function(error) {
  console.log('Error connecting to ROS: ', error);
});

ros.on('close', function() {
  console.log('Connection closed');
});
```

#### Publish Velocity Commands
```javascript
// Create the velocity topic
const cmdVelTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/cmd_vel',
  messageType: 'geometry_msgs/Twist'
});

// Send a velocity command (move forward at 0.5 m/s)
function moveForward() {
  const twist = {
    linear: {
      x: 0.5,
      y: 0.0,
      z: 0.0
    },
    angular: {
      x: 0.0,
      y: 0.0,
      z: 0.0
    }
  };
  
  cmdVelTopic.publish(twist);
  console.log('Published velocity command');
}

// Send rotation command
function rotateClockwise() {
  const twist = {
    linear: {
      x: 0.0,
      y: 0.0,
      z: 0.0
    },
    angular: {
      x: 0.0,
      y: 0.0,
      z: 0.5  // Rotate at 0.5 rad/s
    }
  };
  
  cmdVelTopic.publish(twist);
}

// Stop the robot
function stop() {
  const twist = {
    linear: { x: 0.0, y: 0.0, z: 0.0 },
    angular: { x: 0.0, y: 0.0, z: 0.0 }
  };
  
  cmdVelTopic.publish(twist);
}
```

#### Subscribe to Odometry
```javascript
// Create odometry subscriber
const odomListener = new ROSLIB.Topic({
  ros: ros,
  name: '/odom',
  messageType: 'nav_msgs/Odometry'
});

// Handle odometry messages
odomListener.subscribe(function(message) {
  console.log('Current Position:');
  console.log('  X: ' + message.pose.pose.position.x);
  console.log('  Y: ' + message.pose.pose.position.y);
  console.log('  Z: ' + message.pose.pose.position.z);
  
  console.log('Current Velocity:');
  console.log('  Linear X: ' + message.twist.twist.linear.x + ' m/s');
  console.log('  Angular Z: ' + message.twist.twist.angular.z + ' rad/s');
});
```

#### Call Navigation Tools Service
```javascript
// Create a service client
const navigationToolsService = new ROSLIB.Service({
  ros: ros,
  name: '/robot_toolkit/navigation_tools_srv',
  serviceType: 'robot_toolkit_msgs/NavigationToolsSrv'
});

// Call service to enable mapper
function enableMapper() {
  const request = {
    data: {
      command: 'enable_mapper'
    }
  };

  navigationToolsService.callService(
    request,
    (response) => {
      console.log('Service response: ' + response.result);
    },
    (error) => {
      console.error('Error calling service: ' + error);
    }
  );
}

// Enable autonomous navigation
function enableNavigation() {
  const request = {
    data: {
      command: 'enable_navigate'
    }
  };

  navigationToolsService.callService(
    request,
    (response) => {
      console.log('Navigation enabled: ' + response.result);
    },
    (error) => {
      console.error('Error: ' + error);
    }
  );
}

// Custom configuration
function customNavigationConfig() {
  const request = {
    data: {
      command: 'custom',
      tf_enable: true,
      tf_frequency: 50.0,
      laser_enable: true,
      laser_frequency: 10.0,
      cmd_vel_enable: true,
      security_timer: 0.5,
      move_base_enable: false,
      goal_enable: false
    }
  };

  navigationToolsService.callService(
    request,
    (response) => {
      console.log('Custom navigation config applied: ' + response.result);
    },
    (error) => {
      console.error('Error: ' + error);
    }
  );
}
```

#### Control Vision Tools
```javascript
// Create vision tools service client
const visionToolsService = new ROSLIB.Service({
  ros: ros,
  name: '/robot_toolkit/vision_tools_srv',
  serviceType: 'robot_toolkit_msgs/VisionToolsSrv'
});

// Enable front camera
function enableFrontCamera() {
  const request = {
    data: {
      command: 'enable',
      camera_name: 'front_camera'
    }
  };

  visionToolsService.callService(
    request,
    (response) => {
      console.log('Camera enabled: ' + response.result);
    },
    (error) => {
      console.error('Error: ' + error);
    }
  );
}

// Enable face detection
function enableFaceDetection() {
  const request = {
    data: {
      command: 'enable',
      camera_name: 'front_camera_face_detector'
    }
  };

  visionToolsService.callService(
    request,
    (response) => {
      console.log('Face detection enabled: ' + response.result);
    },
    (error) => {
      console.error('Error: ' + error);
    }
  );
}

// Configure camera with custom settings
function configureFrontCamera() {
  const request = {
    data: {
      command: 'custom',
      camera_name: 'front_camera',
      resolution: 3,  // QVGA (640x480)
      frame_rate: 15,
      color_space: 0  // RGB
    }
  };

  visionToolsService.callService(
    request,
    (response) => {
      console.log('Camera configured: ' + response.result);
    },
    (error) => {
      console.error('Error: ' + error);
    }
  );
}
```

#### Subscribe to Camera Images
```javascript
// Subscribe to front camera images
const cameraListener = new ROSLIB.Topic({
  ros: ros,
  name: '/camera/front/image_raw',
  messageType: 'sensor_msgs/Image'
});

cameraListener.subscribe(function(message) {
  console.log('Received image:');
  console.log('  Width: ' + message.width);
  console.log('  Height: ' + message.height);
  console.log('  Encoding: ' + message.encoding);
  console.log('  Data size: ' + message.data.length + ' bytes');
  
  // Convert to canvas for display
  const imageData = new Uint8ClampedArray(message.data);
  const canvas = document.getElementById('cameraCanvas');
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(message.width, message.height);
  imgData.data.set(imageData);
  ctx.putImageData(imgData, 0, 0);
});
```

#### Subscribe to Face Detection
```javascript
// Subscribe to face detection results
const faceListener = new ROSLIB.Topic({
  ros: ros,
  name: '/face_publisher/front_camera',
  messageType: 'robot_toolkit_msgs/Faces'
});

faceListener.subscribe(function(message) {
  console.log('Detected ' + message.faces.length + ' faces');
  
  for (let i = 0; i < message.faces.length; i++) {
    const face = message.faces[i];
    console.log('  Face ' + face.id + ':');
    console.log('    Angle: ' + face.alpha + '°');
    console.log('    Size: ' + face.size_x + ' x ' + face.size_y);
    console.log('    Center: (' + face.center_x + ', ' + face.center_y + ')');
  }
});
```

#### Text-to-Speech
```javascript
// Create speech topic
const speechTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/speech',
  messageType: 'robot_toolkit_msgs/SpeechMsg'
});

// First enable TTS via service
function enableAndSpeak(text) {
  const audioService = new ROSLIB.Service({
    ros: ros,
    name: '/robot_toolkit/audio_tools_srv',
    serviceType: 'robot_toolkit_msgs/AudioToolsSrv'
  });

  // Enable TTS
  const enableRequest = {
    data: { command: 'enable_tts' }
  };

  audioService.callService(
    enableRequest,
    (response) => {
      console.log('TTS enabled');
      
      // Now publish speech
      const speechMsg = {
        text: text,
        language: 'en',
        animated: true
      };
      
      speechTopic.publish(speechMsg);
      console.log('Published speech: ' + text);
    },
    (error) => {
      console.error('Error enabling TTS: ' + error);
    }
  );
}

// Usage
enableAndSpeak('Hello, I am Pepper!');
```

#### Trigger Animations
```javascript
// Create animation topic
const animationTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/animations',
  messageType: 'robot_toolkit_msgs/AnimationMsg'
});

// Enable animations service
function triggerAnimation(name) {
  const motionService = new ROSLIB.Service({
    ros: ros,
    name: '/robot_toolkit/motion_tools_srv',
    serviceType: 'robot_toolkit_msgs/MotionToolsSrv'
  });

  // Enable animations
  const enableRequest = {
    data: {
      command: 'custom',
      animation: 'enable',
      set_angles: 'disable'
    }
  };

  motionService.callService(
    enableRequest,
    (response) => {
      console.log('Animations enabled');
      
      // Trigger animation
      const animMsg = {
        animation_name: name,
        speed_percent: 100.0,
        loop: false
      };
      
      animationTopic.publish(animMsg);
      console.log('Triggered animation: ' + name);
    },
    (error) => {
      console.error('Error enabling animations: ' + error);
    }
  );
}

// Usage
triggerAnimation('Wave');
triggerAnimation('Dance');
```

#### Subscribe to Laser Scans
```javascript
// Subscribe to laser scanner
const laserListener = new ROSLIB.Topic({
  ros: ros,
  name: '/laser',
  messageType: 'sensor_msgs/LaserScan'
});

laserListener.subscribe((message) => {
  console.log('Laser Scan:');
  console.log('  Angle range: ' + message.angle_min + ' to ' + message.angle_max + ' rad');
  console.log('  Range: ' + message.range_min + ' to ' + message.range_max + ' m');
  console.log('  Samples: ' + message.ranges.length);
  
  // Find minimum range (obstacle detection)
  let minRange = message.range_max;
  let minAngle = 0;
  
  for (let i = 0; i < message.ranges.length; i++) {
    if (message.ranges[i] < minRange && message.ranges[i] > message.range_min) {
      minRange = message.ranges[i];
      minAngle = message.angle_min + i * message.angle_increment;
    }
  }
  
  console.log('  Closest obstacle: ' + minRange.toFixed(2) + ' m at ' + minAngle.toFixed(2) + ' rad');
});
```

---

### Important: roslibjs v2.1.0+ Migration Notes

**All JavaScript examples use plain JavaScript objects** following the roslibjs v2.1.0+ migration. The deprecated classes `ServiceRequest`, `ServiceResponse`, and `Message` have been removed.

#### Key Rules:

1. **Service Requests:** Pass plain objects to `callService()`, not `new ServiceRequest()`
   ```javascript
   // ✅ CORRECT
   const request = {
     data: { command: 'enable_mapper' }
   };
   service.callService(request, successCallback, errorCallback);

   // ❌ INCORRECT (v2.1.0+ will fail)
   const request = new ROSLIB.ServiceRequest({ ... });
   ```

2. **Topic Messages:** Publish plain objects, not `new Message()`
   ```javascript
   // ✅ CORRECT
   const message = {
     linear: { x: 0.5, y: 0.0, z: 0.0 },
     angular: { x: 0.0, y: 0.0, z: 0.0 }
   };
   topic.publish(message);

   // ❌ INCORRECT (v2.1.0+ will fail)
   const message = new ROSLIB.Message({ ... });
   ```

3. **Service Responses:** Handle directly as plain objects from the callback
   ```javascript
   // ✅ CORRECT
   service.callService(request, (response) => {
     console.log(response.result);
   });

   // ❌ INCORRECT (v2.1.0+ will fail)
   const response = new ROSLIB.ServiceResponse({ ... });
   ```

4. **Error Handling:** Always include error callback as third parameter
   ```javascript
   // ✅ CORRECT
   service.callService(
     request,
     (success) => { console.log(success); },
     (error) => { console.error(error); }
   );
   ```

---

## Summary

The **sinfonia_toolkit** provides a comprehensive ROS interface for the Pepper humanoid robot with:

- **15+ published topics** for sensors, cameras, audio, and navigation
- **10+ subscribed topics** for control and configuration
- **6 major service groups** for feature management
- **Dynamic runtime configuration** via service calls
- **Full hardware integration** with Pepper's NaoQi motor system

All interfaces support both native ROS 2 CLI tools and web-based JavaScript clients via `roslibjs`, enabling both autonomous robot behavior and human-in-the-loop teleoperation.

---

**Last Updated:** 2026-09-29  
**Documentation Version:** 1.0  
**Compatibility:** ROS 2 (ported from ROS 1 codebase)
