import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, loadTextureAsync } from 'expo-three';
import { Scene, PerspectiveCamera, BoxGeometry, MeshBasicMaterial, Mesh } from 'three';
import { Asset } from 'expo-asset';

export default function ThreeDScreen({ image }) {
  const lastRotation = useRef({ x: 0, y: 0 });
  const cubeRef = useRef();
  const dragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragging.current = true;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (cubeRef.current) {
          // Adjust sensitivity as needed
          const sensitivity = 0.005;
          cubeRef.current.rotation.y = lastRotation.current.y + gestureState.dx * sensitivity;
          cubeRef.current.rotation.x = lastRotation.current.x + gestureState.dy * sensitivity;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        dragging.current = false;
        if (cubeRef.current) {
          lastRotation.current = {
            x: cubeRef.current.rotation.x,
            y: cubeRef.current.rotation.y,
          };
        }
      },
    })
  ).current;

  const onContextCreate = async (gl) => {
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Load the texture using expo-three's helper
    const asset = Asset.fromModule(image || require('../assets/people/mo.jpeg'));
    await asset.downloadAsync();
    const texture = await loadTextureAsync({ asset });

    // Create a cube with the texture on all faces
    const geometry = new BoxGeometry(1, 1, 1);
    const materials = Array(6).fill(new MeshBasicMaterial({ map: texture }));
    const cube = new Mesh(geometry, materials);
    cubeRef.current = cube;
    scene.add(cube);

    camera.position.z = 3;

    const render = () => {
      requestAnimationFrame(render);
      if (!dragging.current && cubeRef.current) {
        // Auto-rotate when not dragging
        cubeRef.current.rotation.x += 0.01;
        cubeRef.current.rotation.y += 0.01;
        lastRotation.current = {
          x: cubeRef.current.rotation.x,
          y: cubeRef.current.rotation.y,
        };
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glView: {
    flex: 1,
  },
}); 