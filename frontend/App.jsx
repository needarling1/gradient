import { Text, View } from "react-native";
import HomeScreen from "./components/HomeScreen";
import MajorTrackerScreen from "./components/MajorTrackerScreen";
import ToDoScreen from "./components/ToDoScreen";
import ProfileScreen from "./components/ProfileScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  const TabNav = createBottomTabNavigator();
  return (
    <NavigationContainer>
      <TabNav.Navigator>
        <TabNav.Screen name = "Home" component={HomeScreen} options={{ headerShown: false }}/>
        <TabNav.Screen name = "To Do" component={ToDoScreen} options={{ headerShown: false }}/>
        <TabNav.Screen name = "Major Tracker" component={MajorTrackerScreen} options={{ headerShown: false }}/>
        <TabNav.Screen name = "Profile" component={ProfileScreen} options={{ headerShown: false }}/>
      </TabNav.Navigator>
    </NavigationContainer>
  );
}
