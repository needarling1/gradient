import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CoursesScreen from "./CoursesScreen";
import CourseDetailsScreen from "./CourseDetailsScreen";

const Stack = createNativeStackNavigator();

const HomeScreen = ({ user }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Courses"
      >
        {props => <CoursesScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen 
        name="CourseDetails"
      >
        {props => <CourseDetailsScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default HomeScreen;
