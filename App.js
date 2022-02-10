import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { Provider, connect, useDispatch, useSelector } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import {
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
 createDrawerNavigator,
 DrawerContentScrollView,
 DrawerItemList,
 DrawerItem,
} from '@react-navigation/drawer';
import { Svg, Polygon } from 'react-native-svg';

import mech from './assets/mech.png';

const Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'white',
  },
};

const HitType = {
  Regular: 'Regular',
  Critical: 'Critical',
  FloatingCrit: 'Floating Crit',
  ConfirmedHeadHit: 'Confirmed Head Hit',
  UnconfirmedHeadHit: 'Unconfirmed Head Hit',
};

const Facing = {
  L: 'Left',
  C: 'Front/Back',
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
  [Facing.C]: [
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

const Modifier = {
  ArtemisIV: {
    id: 'ArtemisIV',
    label: 'Artemis IV',
    value: 2,
    mutuallyExclusiveWith: ['ArtemisV', 'NARC'],
  },
  ArtemisV: {
    id: 'ArtemisV',
    label: 'Artemis V',
    value: 3,
    mutuallyExclusiveWith: ['ArtemisIV', 'NARC'],
  },
  Apollo: {
    id: 'Apollo',
    label: 'Apollo',
    value: -1,
    mutuallyExclusiveWith: ['NARC'],
  },
  NARC: {
    id: 'NARC',
    label: 'NARC',
    value: 2,
    mutuallyExclusiveWith: ['ArtemisIV', 'ArtemisV', 'Apollo'],
  },
  AMS: {
    id: 'AMS',
    label: 'AMS',
    value: -4,
  },
};

const Range = {
  Short: 'Short',
  Medium: 'Medium',
  Long: 'Long',
};

function makeWeapon({name, sizes, damage=1, grouped=true, modifiers=[], rangeModifiers={}, modes={}, defaultModifiers=[]}) {
  return {
    name: name,
    sizes: sizes,
    damage: damage,
    grouped: grouped,
    modifiers: modifiers,
    rangeModifiers: rangeModifiers,
    modes: modes,
    defaultModifiers: defaultModifiers.map(mod => mod.id),
  };
}


const Weapon = {
  LBX: makeWeapon({
    name: 'LB-X Autocannon',
    sizes: [20, 10, 5, 2],
    grouped: false,
  }),
  LRM: makeWeapon({
    name: 'Long-Range Missiles (LRM)',
    sizes: [20, 10, 5, 2],
    modifiers: [Modifier.ArtemisIV, Modifier.ArtemisV, Modifier.NARC, Modifier.AMS],
  }),
  MRM: makeWeapon({
    name: 'Medium-Range Missiles (MRM)',
    sizes: [40, 30, 20, 10],
    modifiers: [Modifier.Apollo, Modifier.AMS],
  }),
  SRM: makeWeapon({
    name: 'Short-Range Missiles (SRM)',
    sizes: [6, 4, 2],
    damage: 2,
    grouped: false,
    modifiers: [Modifier.ArtemisIV, Modifier.ArtemisV, Modifier.NARC, Modifier.AMS],
  }),
  ATM: makeWeapon({
    name: 'Advanced Tactical Missile (ATM)',
    sizes: [12, 9, 6, 3],
    modes: {
      Standard: {'id': 'Standard', damage: 2},
      ER: {'id': 'ER', damage: 1},
      HE: {'id': 'HE', damage: 3},
    },
    grouped: false,
    modifiers: [Modifier.ArtemisIV, Modifier.AMS],
    defaultModifiers: [Modifier.ArtemisIV],
  }),
  HAG: makeWeapon({
    name: 'Hyper-Assault Gauss (HAG)',
    sizes: [40, 30, 20],
    rangeModifiers: {
      [Range.Long]: -2,
      [Range.Medium]: 0,
      [Range.Short]: 2,
    },
  }),
  SBG: makeWeapon({
    name: 'Silver Bullet Gauss Rifle',
    sizes: [15],
    grouped: false,
  }),
};


function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function rollND6(n) {
  const rolls = [...Array(n)].map(rollD6);
  return {
    rolls: rolls,
    sum: rolls.reduce((a, b) => a + b, 0),
  };
}

function roll2D6() {
  return rollND6(2);
}

function Roll({roll, text}) {
  const dice = roll.rolls.map((n, idx) => <Icon key={idx.toString()} type='material-community' name={'dice-' + n}/> );

  return (
    <View style={styles.row}>
      {text !== undefined && <Text style={styles.defaultText}>{text}</Text>}
      <Text style={[styles.defaultText, {width: 27, textAlign: 'right', paddingRight: 4}]}>{roll.sum}</Text>
      {dice}
    </View>
  );
}

const hitTallyOffsets = {
  [Location.LA]: {top: 65, left: 18, width: 42, height: 30},
  [Location.LT]: {top: 55, left: 66, width: 48, height: 60},
  [Location.CT]: {top: 80, left: 118, width: 46, height: 120},
  [Location.RT]: {top: 55, left: 168, width: 48, height: 60},
  [Location.RA]: {top: 65, left: 221, width: 42, height: 30},
  [Location.H]: {top: 30, left: 118, width: 46, height: 40},
  [Location.LL]: {top: 288, left: 50, width: 52, height: 60},
  [Location.RL]: {top: 288, left: 179, width: 52, height: 60},
};

function HitCount({tally, location_, weapon}) {
  const hits = tally[location_];
  if (!hits.hits) {
    return <></>;
  }

  const style = hitTallyOffsets[location_];

  return (
    <View style={[style, styles.hitCount]}>
      <Text>H: {hits.hits}</Text>
      {hits.crits > 0 && <Text>C: {hits.crits}</Text>}
      {weapon.damage > 1 || weapon.grouped && <Text>D: {hits.damage}</Text>}
    </View>
  );
}

const HitTallyOverlayCoords = {
  [Location.LA]: [
    '57,15',
    '70,29',
    '75,42,',
    '75,48',
    '64,56',
    '63,65',
    '66,65',
    '67,97',
    '62,96',
    '62,100',
    '59,102',
    '56,135',
    '54,138',
    '54,143',
    '55,146',
    '52,190',
    '50,193',
    '20,191',
    '12,178',
    '18,143',
    '21,140',
    '22,135',
    '20,132',
    '23,96',
    '9,85',
    '10,75',
    '22,73',
    '12,62',
    '15,51',
    '29,52',
    '25,32',
    '32,28',
    '47,36',
    '47,18',
  ].join(' '),
};

function HitOverlay({location_, color}) {
  return (
    <View style={{position: 'absolute', left: 0, top: 0}}>
      <Svg height={400} width={280}>
        <Polygon
          points={HitTallyOverlayCoords[location_]}
          stroke='none'
          fill={color}
          fillOpacity={0.5}
        />
      </Svg>
    </View>
  );
}

function HitTally({rolls, facing, weapon}) {
  if (rolls.length == 0) {
    return <></>;
  }

  const tally = {};
  Object.values(Location).forEach(loc => tally[loc] = {hits: 0, crits: 0, damage: 0});

  rolls.forEach(roll => {
    let hitLocation = roll.hit.location_ || hitLocationTable[facing][roll.hit.locationIndex]
    tally[hitLocation].hits++;
    tally[hitLocation].damage += roll.hit.damage;

    if (roll.hit.type == HitType.Critical || roll.hit.type == HitType.FloatingCrit) {
      tally[hitLocation].crits++;
    }
  });

  const counts = Object.values(Location).map(location_ => {
    return (
      <HitCount
        key={location_}
        tally={tally}
        location_={location_}
        weapon={weapon}
      />
    );;
  });

  return (
    <View style={[styles.container, {paddingTop: 20}]}>
      <Text style={styles.section}>Summary</Text>
      <View style={styles.container}>
        <ImageBackground source={mech} style={{ height: 400, width: 280 }}>
          <HitOverlay location_={Location.LA} color='purple'/>
          {counts}
        </ImageBackground>
      </View>
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

function ModifiersSelector({weapon, stateValue, stateSetter}) {
  if (weapon.modifiers.length == 0) {
    return <></>;
  }

  const buttons = weapon.modifiers.map((mod, idx) => {
    const action = () => {
      const newValue = !stateValue[mod.id]
      const updates = {
        [mod.id]: newValue,
      };

      // Check for mutual exclusivity
      if (newValue && mod.mutuallyExclusiveWith) {
        mod.mutuallyExclusiveWith.forEach(exclude => updates[exclude] = false);
      }

      stateSetter({...stateValue, ...updates});
    };

    return (
      <TouchableOpacity
        key={idx.toString()}
        style={[
          styles.modButton,
          idx == 0 ? styles.buttonLeft : (idx == weapon.modifiers.length - 1 ? styles.buttonRight : {}),
          stateValue[mod.id] ? styles.focusedButton : {},
        ]}
        onPress={action}
      >
        <Text style={styles.sideText}>{mod.label}</Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={[styles.row, styles.optionView, {flex: 1, justifyContent: 'space-between'}]}>
      <Text style={styles.optionText}>Modifiers</Text>
      <View style={[{
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }]}>
        {buttons}
      </View>
    </View>
  );
}

function MutuallyExclusiveSelector({label, items, stateValue, stateSetter}) {
  if (items.length <= 1) {
    return <></>;
  }

  let buttons = items.map((item, idx) => {
    return (
      <TouchableOpacity
        key={idx.toString()}
        style={[
          styles.sizeButton,
          idx == 0 ? styles.buttonLeft : (idx == items.length - 1 ? styles.buttonRight : {}),
          stateValue == item ? styles.focusedButton : {},
         ]}
        onPress={ () => stateSetter(item) } >
        <Text style={styles.sideText}>{item}</Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={[styles.row, styles.optionView, {justifyContent: 'space-between'}]}>
      <Text style={styles.optionText}>{label}</Text>
      <View style={[styles.container, {
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }]}>
        {buttons}
      </View>
    </View>
  );
}

function WeaponScreen({ navigation, route }) {
  const settings = useSelector(state => state.settings);
  const weapon = route.params.weapon;
  const sizes = weapon.sizes;

  const modes = Object.keys(weapon.modes).length > 0 ? weapon.modes : {NullMode: {id: 'NullMode', damage: weapon.damage}};
  const modeIds = Object.values(modes).map(mode => mode.id);

  const [size, setSize] = useState(sizes[0]);
  const [facing, setFacing] = useState(Facing.C);
  const [range, setRange] = useState(Range.Medium);
  const [mode, setMode] = useState(modeIds[0]);

  const initialModState = {};
  Object.values(weapon.modifiers).forEach(mod => initialModState[mod.id] = weapon.defaultModifiers.find(element => element === mod.id) !== undefined);

  const [modifiers, setModifiers] = useState(initialModState);

  const [rolls, setRolls] = useState({
    clusterRoll: {sum: 0, rolls: []},
    rolls: [],
    hits: [],
    activeModifiers: [],
    totalModifier: 0,
    rangeModifier: 0,
  });

  //useEffect(() => {
  //  console.log('Size', size);
  //  console.log('Roll state:', rolls);
  //});
  //

  const doRoll = () => {
    const activeModifiers = Object.keys(modifiers).filter(key => modifiers[key]).map(mod => Modifier[mod]);

    const rangeMods = weapon.rangeModifiers || {};
    const rangeModifier = rangeMods[range] || 0;

    const modifier = activeModifiers.map(mod => mod.value).reduce((a, b) => a + b, 0) + rangeModifier;

    const baseClusteRoll = roll2D6();
    const newClusterRoll = {
      ...baseClusteRoll,
      sum: Math.min(12, Math.max(2, baseClusteRoll.sum + modifier)),
    };

    const hits = clusterHitsTable[size][newClusterRoll.sum];
    const groups = weapon.grouped ? Math.ceil(hits / 5) : hits;

    const rolls = [...Array(groups)].map(roll2D6).map((roll, idx) => {
      let damage = modes[mode].damage;

      if (weapon.grouped) {
        damage = idx == groups - 1 ? (hits % 5 || 5) : 5;
      }

      if (settings.floatingCrits && roll.sum == 2) {
        const reroll = {
          roll: roll2D6(),
          reason: Reroll.FloatingCrit,
        };

        return {
          ...roll,
          reroll: reroll,
          hit: {
            type: HitType.FloatingCrit,
            locationIndex: reroll.roll.sum,
            damage: damage,
          },
          showDetail: false,
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
            damage: damage,
          },
          showDetail: false,
        };
      } else {
        return {
          ...roll,
          hit: {
            type: roll.sum == 2 ? HitType.Critical : HitType.Regular,
            locationIndex: roll.sum,
            damage: damage,
          },
          showDetail: false,
        };
      }
    });

    setRolls({
      clusterRoll: newClusterRoll,
      modifiers: activeModifiers,
      rangeModifier: rangeModifier,
      totalModifier: modifier,
      rolls: rolls,
      hits: hits,
    });
  };

  const toggleDetail = (item, index) => {
    const enabled = !item.showDetail;

    setRolls({
      ...rolls,
      rolls: [
        ...rolls.rolls.slice(0, index),
        {...item, showDetail: enabled},
        ...rolls.rolls.slice(index + 1),
      ],
    });
  };

  const renderItem = ({item, index, separators}) => {
    let hitLocation = item.hit.location_ || hitLocationTable[facing][item.hit.locationIndex]

    var flag = null;
    if (item.hit.type == HitType.Critical || item.hit.type == HitType.FloatingCrit) {
      flag = {name: 'warning', color: 'red'};
    } else if (item.hit.type == HitType.UnconfirmedHeadHit || item.hit.type == HitType.ConfirmedHeadHit) {
      flag = {name: 'info', color: 'blue'};
    }

    return (
      <Pressable onPress={() => toggleDetail(item, index)}>
        <View style={styles.row}>
          <View style={styles.hitTableRoll}><Roll roll={item}/></View>
          <Text style={[styles.defaultText, styles.hitTableLocation]}>{hitLocation}</Text>
          <View style={[styles.row, styles.hitTableDamage]}>
            <Text style={styles.defaultText}>{item.hit.damage}</Text>
            {flag !== null && <Icon name={flag.name} color={flag.color}/>}
          </View>
        </View>
        {item.showDetail && (
          <View style={styles.container}>
            {item.hit.type == HitType.Critical && <Text style={styles.defaultText}>Critical hit</Text>}
            {item.hit.type == HitType.FloatingCrit && <Roll roll={item.reroll.roll} text='Floating crit, rolled'/>}
            {item.hit.type == HitType.UnconfirmedHeadHit && <Roll roll={item.reroll.roll} text='Unconfirmed head hit, rolled'/>}
            {item.hit.type == HitType.ConfirmedHeadHit && <Roll roll={item.reroll.roll} text='Confirmed head hit, rolled'/>}
          </View>
        )}
      </Pressable>
    );
  };

  let showResult = () => {
    return (
      <View style={[styles.row, {paddingBottom: 15}]}>
        <Roll roll={rolls.clusterRoll} text='Clusters: '/>
        {(rolls.modifiers.length > 0 || rolls.rangeModifier != 0) && (
          <Text style={styles.defaultText}> (Mod: {rolls.totalModifier < 0 ? rolls.totalModifier : `+${rolls.totalModifier}`})</Text>
        )}
        <Text style={styles.defaultText}> ({rolls.hits}/{size} hits)</Text>
      </View>
    );
  };

  //const sizeView = SizeSelector(sizes, size, setSize);
  //const modView = ModifiersSelector(weapon, modifiers, setModifiers);

  return (
    <FlatList
      ItemSeparatorComponent={({highlighted}) =>
        <View style={[styles.separator, {marginHorizontal: '2%'}]}/>
      }
      ListHeaderComponent={
      <>
        <View style={styles.container}>
          <MutuallyExclusiveSelector label='Size' items={weapon.sizes} stateValue={size} stateSetter={setSize} />
          <ModifiersSelector weapon={weapon} stateValue={modifiers} stateSetter={setModifiers} />
          <MutuallyExclusiveSelector label='Facing' items={Object.values(Facing)} stateValue={facing} stateSetter={setFacing} />
          {weapon.rangeModifiers.length > 0 && (
          <MutuallyExclusiveSelector label='Range' items={Object.values(Range)} stateValue={range} stateSetter={setRange} />
          )}
          <MutuallyExclusiveSelector label='Mode' items={modeIds} stateValue={mode} stateSetter={setMode} />

          <TouchableOpacity
            onPress={doRoll}
            style={[styles.button, styles.padded]}>
            <Text style={styles.sideText}>
              Roll!
            </Text>
          </TouchableOpacity>

          {rolls.clusterRoll.sum > 0 && showResult()}
        </View>
        {rolls.clusterRoll.sum > 0 && (
        <View style={styles.row}>
          <Text style={[styles.headerText, styles.hitTableRoll]}>Roll</Text>
          <Text style={[styles.headerText, styles.hitTableLocation]}>Location</Text>
          <Text style={[styles.headerText, styles.hitTableDamage]}>Damage</Text>
          <View style={styles.separator}/>
        </View>)}
      </>}
      ListFooterComponent={
      <>
        <HitTally rolls={rolls.rolls} facing={facing} weapon={weapon} />
      </>
      }
      data={rolls.rolls}
      keyExtractor={(roll, idx) => idx}
      renderItem={renderItem}
      style={{marginHorizontal: '1%'}}
    />
  );
}

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const WeaponSizeContext = React.createContext([]);

function MainStackScreen() {
  const weapons = Object.values(Weapon).map(weapon => (
    <Drawer.Screen key={weapon.name} name={weapon.name} component={WeaponScreen} initialParams={{weapon: weapon}} />
  ));

  return (
    <Drawer.Navigator tabBarPosition='bottom' drawerContent={(props) => <CustomDrawerContent {...props} />}>
      {weapons}
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <StatusBar />
      <NavigationContainer theme={Theme}>
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
  padded: {
    marginBottom: 20,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scrollContainer: {
    backgroundColor: '#fff',
  },
  defaultText: {
    fontSize: 18,
    color: '#000',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    fontSize: 24,
    color: '#000',
  },
  sideText: {
    fontSize: 18,
    color: '#000',
  },
  optionText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'left',
    paddingVertical: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  modButton: {
    backgroundColor: '#ccc',
    marginHorizontal: 1,
    padding: 12,
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
    paddingVertical: 10,
    width: '100%',
  },
  hitCount: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: '#ccc',
  },
  hitTableRoll: {
    alignItems: 'center',
    textAlign: 'center',
    width: '30%',
  },
  hitTableLocation: {
    justifyContent: 'center',
    textAlign: 'center',
    width: '40%',
  },
  hitTableDamage: {
    justifyContent: 'space-between',
    width: '26%',
  },
});
