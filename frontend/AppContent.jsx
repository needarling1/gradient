import { Text, View } from "react-native";
import HomeScreen from "./components/HomeScreen";
import MajorTrackerScreen from "./components/MajorTrackerScreen";
import ToDoScreen from "./components/ToDoScreen";
import ProfileScreen from "./components/ProfileScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import React from 'react';
import { Ionicons } from '@expo/vector-icons'; // <-- ADD THIS
import 'expo-dev-client';

export default function AppContent({ user }) {
  const TabNav = createBottomTabNavigator();

  return (
    <NavigationContainer>
      <TabNav.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'To Do') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Major Tracker') {
              iconName = focused ? 'school' : 'school-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <TabNav.Screen name="Home">
          {() => <HomeScreen user={user} />}
        </TabNav.Screen>
        <TabNav.Screen name="To Do" component={ToDoScreen} />
        <TabNav.Screen name="Major Tracker" component={MajorTrackerScreen} />
        <TabNav.Screen name="Profile">
          {() => <ProfileScreen user={user} />}
        </TabNav.Screen>
      </TabNav.Navigator>
    </NavigationContainer>
  );
}
