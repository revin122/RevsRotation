import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps
} from '@react-navigation/native-stack';
import { Node } from './types';
import { flattenLeafPaths } from './utils';
import ListScreen from './ListScreen';

type RootStackParamList = {
  RevRotation: { path: string[] };
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const initialData: Node = {
  id: 'root',
  name: 'list',
  children: []
}

export default function App() {
  const [data, setData] = useState<Node>(initialData);
  const [leafPaths, setLeafPaths] = useState<string[][]>([]);

  useEffect(() => {
    const paths = flattenLeafPaths(data);
    setLeafPaths(paths);
    if (paths.length > 0) {
    }
  }, [data])

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name='RevRotation'
          component={({
            navigation,
            route
          }: NativeStackScreenProps<RootStackParamList, 'RevRotation'>) => (
            <ListScreen
              data={data}
              path={route.params.path}
              onNavigate={(newPath) =>
                navigation.push('RevRotation', { path: newPath })
              }
              onBack={() => navigation.goBack()}
              onDataUpdate={setData}
              isRoot={route.params.path.length === 0}
            />
          )}
          initialParams={{ path: [] }}
          options={{
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
