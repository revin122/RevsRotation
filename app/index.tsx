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
  MyList: { path: number[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const initialData: Node = {
  type: 'list',
  children: []
};

export default function App() {
  const [data, setData] = useState<Node>(initialData);
  const [leafPaths, setLeafPaths] = useState<number[][]>([]);
  const [leafIndex, setLeafIndex] = useState<number>(0);

  useEffect(() => {
    const paths = flattenLeafPaths(data);
    setLeafPaths(paths);
    if (paths.length > 0) {
      setLeafIndex(Math.min(leafIndex, paths.length - 1));
    }
  }, [data]);

  const goToLeaf = (index: number, navigation: any) => {
    if (index >= 0 && index < leafPaths.length) {
      setLeafIndex(index);
      navigation.navigate('MyList', { path: leafPaths[index] });
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MyList"
          component={({
            navigation,
            route
          }: NativeStackScreenProps<RootStackParamList, 'MyList'>) => (
            <ListScreen
              data={data}
              path={route.params.path}
              onNavigate={(newPath) =>
                navigation.push('MyList', { path: newPath })
              }
              onBack={() => navigation.goBack()}
              onDataUpdate={setData}
              isRoot={route.params.path.length === 0}
              onNextLeaf={() => goToLeaf(leafIndex + 1, navigation)}
              onPrevLeaf={() => goToLeaf(leafIndex - 1, navigation)}
              leafIndex={leafIndex}
              maxLeafIndex={leafPaths.length - 1}
            />
          )}
          initialParams={{ path: [] }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
