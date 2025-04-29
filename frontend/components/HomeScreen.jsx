import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CoursesScreen from "./CoursesScreen";
import CourseDetailsScreen from "./CourseDetailsScreen";

const Stack = createNativeStackNavigator();

const HomeScreen = ( {user} ) => {
  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator>
            <Stack.Screen 
              name="Courses" 
              options={{ title: '' }}
            >
              {props => <CoursesScreen {...props} user={user} />}
            </Stack.Screen>
            
            <Stack.Screen 
              name="CourseDetails" 
              options={{ title: '' }}
            >
              {props => <CourseDetailsScreen {...props} user={user} />}
            </Stack.Screen>
          </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default HomeScreen;
