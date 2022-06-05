# **Autonomous Software Agents - Project**

University of Trento - Trento, 2022

Emiliano Tolotti - emiliano.tolotti@studenti.unitn.it

## **Project structure**

- src/devices/ - contains devices files
- src/intentions/ - intentions and goals files
- src/observables/ - house observables such as probes and people
- src/scenarios/ - scenarios definition
- logs/ - log files

## **Scenario**

### **People**

People are managed by a daily schedule in the scenario file

- Alice
- Bob

### **Rooms**

- kitchen
- bedroom
- bathroom
- garage
- studio
- entrance
- garden
- livingroom

### **Devices**

#### **Lights**

Lights provide illumination to rooms

- kitchen_light
- bedroom_light
- bathroom_light
- garage_light
- studio_light
- entrance_light
- garden_light
- livingroom_light

#### **Heatings**

Heatings increse the temperature of rooms

- kitchen_heating
- bedroom_heating
- bathroom_heating
- studio_heating
- livingroom_heating

#### **Curtains**

Curtains can be opened or closed

- kitchen_curtains
- livingroom_curtains

#### **Irrigation**

The irrigation system waters the garden

- garden_irrigation
  - irrigation
  - humidity_probe

#### **Boiler**

The water boiler heats the water with gas or solar water

- water_boiler
  - boiler
  - water_probe
  - solar_probe

#### **Vacuum**

The vacuum device simulates moving and cleaning actions by waiting some time

- vacuum_bot

### **Probes**

#### **Light probes**

Light probes are managed by a daily schedule in the scenario file and reading is influenced by curtains and room lights

- kitchen_light_probe
- bedroom_light_probe
- bathroom_light_probe
- garage_light_probe
- studio_light_probe
- entrance_light_probe
- garden_light_probe
- livingroom_light_probe

#### **Temperature probes**

Temperature probes are managed in the scenario file, increasing and decreasing room temperature based on the heating time

- kitchen_temperature_probe
- bedroom_temperature_probe
- bathroom_temperature_probe
- studio_temperature_probe
- livingroom_temperature_probe

### **Utilities**

- electricity
- gas

### **Environment**

Environment properties are external factors not influenced by the agents

- external_light
- rain_probability

## **Agents**

### **House Agent**

The house agent manages the house. The initial beliefset is defined in the scenario file.

#### **Goals**

The **"sense"** intentions relate to update of the beliefset based on probes and devices, for the other intentions to react at the changes of the beliefset.

- **HeatWaterGoal** - heat water with solar if possible or with gas
- **OpenCurtainGoal**, **CloseCurtainGoal**, **CurtainsHouseOccupiedGoal** - open and close curtains, also based on house occupation
- **HeatUpGoal**, **KeepHeatedOccupationGoal**, **HeatRoomsGoal**, **HeatOccupationGoal**  - turn on and off heating based on temperature and occupation
- **IrrigationGoal**, **IrrigateGoal** - irrigate, based on schedule and occupation
- **TurnOnLightGoal**, **TurnOffLightGoal**, **LightsIntensityGoal**, **ReturnToNormalGoal**, **LightOccupationGoal** - turn light on and off based on occupation, dim light intensity and return to auto behavior
- **CleanGoal** - clean the house based on schedule
- **SensePeopleGoal**, **SenseTemperaturesGoal**, **SenseBoilerHeatGoal**,  **SenseCurtainsGoal**, **SenseHeatingsGoal**, **SenseTemperatureProbesGoal**, **SenseHumidityGoal**, **SenseWeatherGoal**, **SenseLightsGoal**, **SenseLightProbesGoal** - sense for devices and probes to modify beliefset

### **Bot Agent**

The bot agent manages the vacuum cleaner bot. The initial beliefset is defined in the scenario file.

#### **Planning goals**

- **CleanRoomsGoal** - tries to clean all the rooms, pushes a **pddl goal** for cleaning the not occupied rooms and move to the starting room for charging, until all rooms are cleaned or after a maximum number of intention trials
- **SenseBatteryGoal** - sensing for battery status

#### **PDDL domain and problem**

The bot can move between rooms that share a door and can clean rooms that are initially not occupied.

The pddl domain of the vacuum bot contains 8 predicates:

- **cleaned** - indicates a clean room
- **in-room** - indicates the current room
- **door** - indicates the possibility to pass between two rooms
- **room_occupied** - indicates the occupation of the room
- **charge-high** - indicates high charge
- **charge-med** - indicates medium charge
- **charge-low** - indicates low charge
- **base** - indicates the location of the charging base

and 4 pddl actions:

- **move** - moves from a room to another
- **clean1** - cleans the room when has high battery
- **clean2** - cleans the room when has med battery
- **charge** - charges the battery

PDDL file examples:

- **vacuum_domain.pddl** - vacuum agent pddl domain file
- **vacuum_problem.pddl** - vacuum agent example problem, consists in cleaning all rooms and charging

## **Run**

### **Run scenario**

    node index.js

### **Log to file**

    .\log.bat
