import React, { useEffect, useCallback } from 'react';
import { useRos } from '../contexts/RosContext'
import { createService } from '../services/RosManager';
import * as ROSLIB from 'roslib';

const Base = () => {
    const { ros, baseSpeed } = useRos();

    useEffect(() => {
        if (ros) {
            const enableNavigationService = createService(ros, '/robot_toolkit/navigation_tools_srv', 'robot_toolkit_msgs/navigation_tools_srv');
            const navRequest = {
                data: {
                    "command": "enable_all",
                    "depth_to_laser_parameters": {
                        "resolution": 0,
                        "scan_time": 0.0,
                        "range_min": 0.0,
                        "range_max": 0.0,
                        "scan_height": 0.0
                    },
                    "tf_enable": false,
                    "tf_frequency": 0.0,
                    "odom_enable": false,
                    "odom_frequency": 0.0,
                    "laser_enable": false,
                    "laser_frequency": 0.0,
                    "cmd_vel_enable": false,
                    "security_timer": 0.0,
                    "move_base_enable": false,
                    "goal_enable": false,
                    "robot_pose_suscriber_enable": false,
                    "path_enable": false,
                    "path_frequency": 0.0,
                    "robot_pose_publisher_enable": false,
                    "robot_pose_publisher_frequency": 0.0,
                    "result_enable": false,
                    "depth_to_laser_enable": false,
                    "free_zone_enable": false
                }

            };
            enableNavigationService.callService(navRequest, (result) => {
                console.log('Navigation tools service initialized:', result);
            }, (error) => {
                console.error('Error initializing navigation service:', error);
            });
        }
    }, [ros]);

    function handleKeyPress(event) {
        const bannedHTMLElements = ["input", "textarea"];
        if (bannedHTMLElements.includes(event.target.localName))
            return;

        var cmdVel = new ROSLIB.Topic({
            ros: ros,
            name: '/cmd_vel',
            messageType: 'geometry_msgs/Twist'
        });

        let message = {
            linear: {
                x: 0,
                y: 0,
                z: 0
            },
            angular: {
                x: 0,
                y: 0,
                z: 0
            }
        };

        const pressedKey = event.keyCode;
        const keys = {
            A: 65,
            D: 68,
            W: 87,
            S: 83,
            E: 69,
            Q: 81
        };

        if (pressedKey === keys.A) {
            message.linear.y = baseSpeed;
        } else if (pressedKey === keys.D) {
            message.linear.y = -baseSpeed;
        } else if (pressedKey === keys.W) {
            message.linear.x = baseSpeed;
        } else if (pressedKey === keys.S) {
            message.linear.x = -baseSpeed;
        }

        if (pressedKey === keys.E) {
            message.angular.z = -baseSpeed;
        } else if (pressedKey === keys.Q) {
            message.angular.z = baseSpeed;
        }

        var twist = new ROSLIB.Message(message);
        cmdVel.publish(twist);

        // console.log(event);
    }

    const cachedHandleKeyPess = useCallback(handleKeyPress, [ros, baseSpeed])

    useEffect(() => {
        window.addEventListener("keydown", cachedHandleKeyPess, false);

        return () => {
            window.removeEventListener("keydown", cachedHandleKeyPess, false);
        };
    }, [cachedHandleKeyPess]);

    return (<></>);
}

export default Base;
