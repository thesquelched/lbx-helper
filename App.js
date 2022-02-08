import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { Provider, connect, useDispatch, useSelector } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { StatusBar } from 'expo-status-bar';
import { FlatList, ImageBackground, StyleSheet, Text, Switch, View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
 createDrawerNavigator,
 DrawerContentScrollView,
 DrawerItemList,
 DrawerItem,
} from '@react-navigation/drawer';
import mech from './assets/mech.png';

const HitType = {
  Regular: 'Regular',
  Critical: 'Critical',
  FloatingCrit: 'Floating Crit',
  ConfirmedHeadHit: 'Confirmed Head Hit',
  UnconfirmedHeadHit: 'Unconfirmed Head Hit',
};

const Facing = {
  L: 'Left',
  F: 'Front',
  B: 'Rear',
  R: 'Right',
};

const Reroll = {
  FloatingCrit: 'FloatingCrit',
  ConfirmHeadHit: 'ConfirmHeadHit',
};

const Location = {
  LT: 'Left Torso',
  LL: 'Left Leg',
  LA: 'Left Arm',
  CT: 'Center Torso',
  RT: 'Right Torso',
  RL: 'Right Leg',
  RA: 'Right Arm',
  H: 'Head',
  RLT: 'Rear Left Torso',
  RCT: 'Rear Center Torso',
  RRT: 'Rear Right Torso',
};

const clusterHitsTable = {
  2:  [0, 0,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  2],
  3:  [0, 0,  1,  1,  1,  2,  3,  2,  2,  2,  3,  3,  3],
  4:  [0, 0,  1,  2,  2,  2,  2,  3,  3,  3,  3,  4,  4],
  5:  [0, 0,  1,  2,  2,  3,  3,  3,  3,  4,  4,  5,  5],
  6:  [0, 0,  2,  2,  3,  3,  4,  4,  4,  5,  5,  6,  6],
  7:  [0, 0,  2,  2,  3,  4,  4,  4,  4,  6,  6,  7,  7],
  8:  [0, 0,  3,  3,  4,  4,  5,  5,  5,  6,  6,  8,  8],
  9:  [0, 0,  3,  3,  4,  5,  5,  5,  5,  7,  7,  9,  9],
  10: [0, 0,  3,  3,  4,  6,  6,  6,  6,  8,  8, 10, 10],
  12: [0, 0,  4,  4,  5,  8,  8,  8,  8, 10, 10, 12, 12],
  15: [0, 0,  5,  5,  6,  9,  9,  9,  9, 12, 12, 15, 15],
  20: [0, 0,  6,  6,  9, 12, 12, 12, 12, 16, 16, 20, 20],
  30: [0, 0, 10, 10, 12, 18, 18, 18, 18, 24, 24, 30, 30],
  40: [0, 0, 12, 12, 18, 24, 24, 24, 24, 32, 32, 40, 40],
};

const hitLocationTable = {
  [Facing.L]: [
    null,
    null,
    Location.LT,
    Location.LL,
    Location.LA,
    Location.LA,
    Location.LL,
    Location.LT,
    Location.CT,
    Location.RT,
    Location.RA,
    Location.RL,
    Location.H,
  ],
  [Facing.F]: [
    null,
    null,
    Location.CT,
    Location.RA,
    Location.RA,
    Location.RL,
    Location.RT,
    Location.CT,
    Location.LT,
    Location.LL,
    Location.LA,
    Location.LA,
    Location.H,
  ],
  [Facing.B]: [
    null,
    null,
    Location.RCT,
    Location.RA,
    Location.RA,
    Location.RL,
    Location.RRT,
    Location.RCT,
    Location.RLT,
    Location.LL,
    Location.LA,
    Location.LA,
    Location.H,
  ],
  [Facing.R]: [
    null,
    null,
    Location.RT,
    Location.RL,
    Location.RA,
    Location.RA,
    Location.RL,
    Location.RT,
    Location.CT,
    Location.LT,
    Location.LA,
    Location.LL,
    Location.H,
  ]
};

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollND6(n) {
  const rolls = [...Array(n)].map(rollD6);
  return {
    rolls: rolls,
    sum: rolls.reduce((a, b) => a + b),
  };
}

function roll2D6() {
  return rollND6(2);
}

function Roll({roll}) {
  const dice = roll.rolls.map((n, idx) => <Icon key={idx.toString()} type='material-community' name={'dice-' + n}/> );

  return (
    <View style={styles.row}>
      <Text style={[styles.defaultText, {width: 38}]}>{roll.sum}</Text>
      {dice}
    </View>
  );
}

const hitTallyOffsets = {
  [Location.LA]: {top: 65, left: 18, width: 42, height: 30},
  [Location.LT]: {top: 55, left: 66, width: 48, height: 60},
  [Location.RLT]: {top: 55, left: 66, width: 48, height: 60},
  [Location.CT]: {top: 80, left: 118, width: 46, height: 120},
  [Location.RCT]: {top: 80, left: 118, width: 46, height: 120},
  [Location.RT]: {top: 55, left: 168, width: 48, height: 60},
  [Location.RRT]: {top: 55, left: 168, width: 48, height: 60},
  [Location.RA]: {top: 65, left: 221, width: 42, height: 30},
  [Location.H]: {top: 30, left: 118, width: 46, height: 40},
  [Location.LL]: {top: 288, left: 50, width: 52, height: 60},
  [Location.RL]: {top: 288, left: 179, width: 52, height: 60},
};

function HitCount({tally, location_}) {
  let hits = tally[location_];
  if (!hits.hits) {
    return <></>;
  }

  let style = hitTallyOffsets[location_];


  return (
    <View style={[style, styles.hitCount]}>
      <Text>{hits.hits}{hits.crits > 0 && ' (' + hits.crits + ')'}</Text>
    </View>
  );
}

function HitTally({rolls, facing}) {
  if (rolls.length == 0) {
    return <></>;
  }

  const tally = {};
  Object.values(Location).forEach(loc => tally[loc] = {hits: 0, crits: 0});

  rolls.forEach(roll => {
    let hitLocation = roll.hit.location_ || hitLocationTable[facing][roll.hit.locationIndex]
    tally[hitLocation].hits++;

    if (roll.hit.type == HitType.Critical || roll.hit.type == HitType.FloatingCrit) {
      tally[hitLocation].crits++;
    }
  });

  console.log('The tally is:', tally);

  const counts = Object.values(Location).map(location_ => <HitCount key={location_} tally={tally} location_={location_}/>);

  return (
    <View style={styles.container}>
      <ImageBackground source={mech} style={{ height: 400, width: 280 }}>
        {counts}
      </ImageBackground>
    </View>
  );
}

const initialSettings = {
  floatingCrits: true,
  confirmHeadHits: true,
}

function settingsReducer(state = initialSettings, action) {
  switch (action.type) {
    case 'settings/setFloatingCrits':
      return {...state, floatingCrits: action.payload};
    case 'settings/setConfirmHeadHits':
      return {...state, confirmHeadHits: action.payload};
    default:
      return state;
  }
}

let store = createStore(combineReducers({
  settings: settingsReducer,
}));

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label='Settings'
        icon={(focused, color, size) => <Icon color={color} size={size} name='settings' />}
        onPress={() => props.navigation.navigate('Settings')}/>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function createAction(type, payload) {
  return {
    type: type,
    payload: payload,
  };
}

function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings);

  return (
    <View style={[styles.container, {
      justifyContent: 'flex-start',
    }]}>
      <View style={styles.row}>
        <Text style={styles.optionText}>Floating criticals</Text>
        <Switch
          value={settings.floatingCrits}
          onValueChange={ (value) => dispatch(createAction('settings/setFloatingCrits', value)) } />
      </View>

      <View style={styles.row}>
        <Text style={styles.optionText}>Confirm head hits</Text>
        <Switch
          value={settings.confirmHeadHits}
          onValueChange={ (value) => dispatch(createAction('settings/setConfirmHeadHits', value)) } />
      </View>

    </View>
  );
}

function SizeSelector(sizes, stateValue, stateSetter) {
  let buttons = sizes.map((size, idx) => {
    return (
      <TouchableOpacity
        key={idx.toString()}
        style={[
          styles.sizeButton,
          idx == 0 ? styles.buttonLeft : (idx == sizes.length - 1 ? styles.buttonRight : {}),
          stateValue == size ? styles.focusedButton : {},
         ]}
        onPress={ () => stateSetter(size) } >
        <Text style={styles.sideText}>{size}</Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={[styles.row, styles.optionView]}>
      <Text style={styles.optionText}>Size</Text>
      <View style={[styles.container, {
        flexDirection: 'row',
      }]}>
        {buttons}
      </View>
    </View>
  );
}

function WeaponScreen({ navigation }) {
  const settings = useSelector(state => state.settings);

  const [size, setSize] = useState(20);
  const [facing, setFacing] = useState(Facing.F);

  const [rolls, setRolls] = useState({
    clusterRoll: {sum: 0, rolls: []},
    rolls: [],
    hits: [],
  });

  //useEffect(() => {
  //  console.log('Size', size);
  //  console.log('Roll state:', rolls);
  //});
  //
  const facingView = (
    <View style={[styles.optionView, styles.row]}>
      <Text style={styles.optionText}>Facing</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.facingButton,
            styles.buttonLeft,
            facing === Facing.L? styles.focusedButton : {},
           ]}
          onPress={ () => setFacing(Facing.L) } >
          <Text style={styles.sideText}>{Facing.L}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.facingButton,
            facing === Facing.F ? styles.focusedButton : {},
          ]}
          onPress={ () => setFacing(Facing.F) } >
          <Text style={styles.sideText}>{Facing.F}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.facingButton,
            facing === Facing.B ? styles.focusedButton : {},
          ]}
          onPress={ () => setFacing(Facing.B) } >
          <Text style={styles.sideText}>{Facing.B}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.facingButton,
            styles.buttonRight,
            facing === Facing.R ? styles.focusedButton : {},
          ]}
          onPress={ () => setFacing(Facing.R) } >
          <Text style={styles.sideText}>{Facing.R}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const doRoll = () => {
    let newClusterRoll = roll2D6();
    let hits = clusterHitsTable[size][newClusterRoll.sum];
    let rolls = [...Array(hits)].map(roll2D6).map((roll, idx) => {
      if (settings.floatingCrits && roll.sum == 2) {
        let reroll = {
          roll: roll2D6(),
          reason: Reroll.FloatingCrit,
        };

        return {
          ...roll,
          reroll: reroll,
          hit: {
            type: HitType.FloatingCrit,
            locationIndex: reroll.roll.sum,
          },
        };
      } else if (settings.confirmHeadHits && roll.sum == 12) {
        let reroll = {
          roll: rollND6(1),
          reason: Reroll.ConfirmHeadHit,
        };
        let isConfirmed = reroll.roll.sum >= 4;

        return {
          ...roll,
          reroll: reroll,
          hit: {
            type: isConfirmed ? HitType.ConfirmedHeadHit : HitType.UnconfirmedHeadHit,
            location_: isConfirmed ? Location.H : Location.CT,
          },
        };
      } else {
        return {
          ...roll,
          hit: {
            type: roll.sum == 2 ? HitType.Critical : HitType.Regular,
            locationIndex: roll.sum,
          }
        };
      }
    });

    setRolls({
      clusterRoll: newClusterRoll,
      rolls: rolls,
      hits: hits,
    });
  };

  const renderItem = ({item, index}) => {
    let hitLocation = item.hit.location_ || hitLocationTable[facing][item.hit.locationIndex]

    return (
      <View style={styles.row}>
        <Roll roll={item}/>
        <Text style={styles.defaultText}>{hitLocation}</Text>
        {(item.hit.type == HitType.Critical || item.hit.type == HitType.FloatingCrit) && <Text style={styles.defaultText}> (Crit!)</Text>}
        {item.hit.type == HitType.UnconfirmedHeadHit && <Text style={styles.defaultText}> (Unconfirmed, rolled {item.reroll.roll.sum})</Text>}
        {item.hit.type == HitType.ConfirmedHeadHit && <Text style={styles.defaultText}> (Confirmed, rolled {item.reroll.roll.sum})</Text>}
      </View>
    );
  };

  let showResult = () => {
    return (
      <View>
        <View style={styles.row}>
          <Text style={styles.defaultText}>Cluster roll:</Text>
          <Roll roll={rolls.clusterRoll}/>
        </View>
        <View style={styles.row}>
          <Text style={styles.defaultText}>Cluster hits: {rolls.hits}</Text>
        </View>
      </View>
    );
  };

  const sizeView = SizeSelector([20, 10, 5, 2], size, setSize);

  return (
    <FlatList
      ListHeaderComponent={
      <>
        <View style={styles.container}>
          {sizeView}
          {facingView}

          <TouchableOpacity
            onPress={doRoll}
            style={styles.button}>
            <Text style={styles.sideText}>
              Roll!
            </Text>
          </TouchableOpacity>

          {rolls.clusterRoll.sum > 0 && showResult()}
          <HitTally rolls={rolls.rolls} facing={facing} />
        </View>
      </>}
      data={rolls.rolls}
      keyExtractor={(roll, idx) => idx}
      renderItem={renderItem}
    />
  );
}

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function MainStackScreen() {
  return (
    <Drawer.Navigator tabBarPosition='bottom' drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name='LB-X Autocannon' component={WeaponScreen} />
      <Drawer.Screen name='Long-Range Missiles (LRM)' component={WeaponScreen} />
      <Drawer.Screen name='Medium-Range Missiles (MRM)' component={WeaponScreen} />
      <Drawer.Screen name='Short-Range Missiles (SRM)' component={WeaponScreen} />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Group>
            <Stack.Screen name='Weapons' component={MainStackScreen} />
          </Stack.Group>
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name='Settings' component={SettingsScreen} />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: '2%',
  },
  scrollContainer: {
    backgroundColor: '#fff',
  },
  defaultText: {
    fontSize: 20,
    color: '#000',
  },
  sideText: {
    fontSize: 20,
    color: '#000',
  },
  optionText: {
    fontSize: 20,
    color: '#000',
  },
  button: {
    backgroundColor: '#ccc',
    padding: 12,
    alignItems: 'center',
  },
  facingButton: {
    backgroundColor: '#ccc',
    marginHorizontal: 1,
    padding: 12,
  },
  sizeButton: {
    backgroundColor: '#ccc',
    marginHorizontal: 1,
    padding: 12,
    width: 50,
    alignItems: 'center',
  },
  buttonLeft: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  buttonRight: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  focusedButton: {
    backgroundColor: '#aaa',
  },
  numberInput: {
    height: 20,
    marginHorizontal: '1%',
  },
  optionView: {
    marginBottom: 20,
  },
  hitCount: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
