# Angular-builder Documentation
Angular-builder allows you as a developer to scan their projects and represent into a json.
Also, you can execute from one to many angular schematics.


* [Angular-builder Documentation](#angular-builder-documentation)
  * [How to use this schematics' package](#how-to-use-this-schematics-package)
  * [Features](#features)
    * [Next Features](#coming-features)
  * [Scan your project](#scan-your-project)
    * [Problem to solve?](#problem-to-solve)
  * [Builder](#builder)
    * [Problem to solve?](#problem-to-solve-1)
    * [Analyze the json structure](#analyze-the-json-structure)
      * [**JSON Level 1**](#level-1)
      * [**JSON Level 2**](#level-2)
        * [Settings](#settings)
        * [Projects](#projects)
      * [**JSON Level 3**](#level-3)
        * [Folder or Schematic?](#folder-or-schematic)
    * [Priority of settings in different levels.](#priority-of-settings-in-different-levels)



## How to use this schematics' package
<code>ng add @danils/angular-builder</code> or <code>npm install -g @danils/angular-builder</code>


When you have already installed, follow these steps:
1. Execute <code>ng g @danils/angular-builder:**scan**</code>
2. Modify the json created.
3. Execute <code>ng g @danils/angular-builder:**build**</code>
4. If the collections are not installed, angular-builder can install them.

## Features
* Scan and represent your project into a json file.
* Execute any schematic created with @angular-devkit
* Could install the collection if they are not installed.
* Could uninstall the collections installed.

### Coming Features
* If the schematic doesn't find a workspace, it can create it.
* Choose which collections uninstall.
* Allow managing interdependencies between the execution of the schematics.
* Support Nx.

## Scan your project

<code>ng g @danils/angular-builder:scan</code> or <code>ng g @danils/angular-builder:s</code>

### Problem to solve?
Angular Builder uses a json file to execute schematics at the same time.
For this reason scan schematic allows you to
scan your project and represent the result into a json file.

## Builder

<code>ng g @danils/angular-builder:build</code> or <code>ng g @danils/angular-builder:b</code>

Example here:
[Custom JSON File](docs/customStructure.json).

### Problem to solve?

Working with the Angular framework, you can use schematic's custom or by default like <code>ng g component</code>;
with this limitation, this schematic allows you to execute any schematic in any folder or at the root level.

That is an amazing feature because you can solve two main scenarios:
1. You can start projects faster.
2. You can implement features on existed projects. Scan your project and call whichever schematic that you want.

### Analyze the json structure
When you see the json structure for the first time, you can see the file has different levels.

#### **Level 1**
At the root level, you can see these properties:

| Property name | Description                                                                                                                                                        | Optional |
|---------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| $schema       | The reference to a file that allow you to know what properties can you add to the file.                                                                            |          |
| settings      | settings contains collection and collections contain schematics settings                                                                                           | true     |
| projects      | angular workspaces allows you to have many projects. <br/>This section has all the existed projects but also if you add some that doesn't exist it will create it. | false    |
| schematic     | you can execute schematics at the root level, usually these schematics are for configuration purposes.                                                             |          |


#### **Level 2**
##### **Settings**
The purpose of this property is to allow you to specify settings for all schematics.

For grouping purpose, settings have collections. 
For example, **@schematics/angular** are the collection for default schematics like components, services, pipes.

Every collection has schematics, in this section you can set all the properties that the schematic allows.
I will list some of the most common schematics with links to see the angular default schematic settings.

**Notes:**<br/>
If you want that the schematic build installs collections, add these collections to global settings. No matter if you don't define any schematic inside.

| Schematics for @schematics/angular                                                                              |
|-----------------------------------------------------------------------------------------------------------------|
| [component](https://github.com/angular/angular-cli/blob/main/packages/schematics/angular/component/schema.json) |
| [service](https://github.com/angular/angular-cli/blob/main/packages/schematics/angular/service/schema.json)     |
| [directive](https://github.com/angular/angular-cli/blob/main/packages/schematics/angular/directive/schema.json) |

**Schematic's settings allow you to have an alias**<br/>
The alias allows you to not specify the collection and also has a friendly name.

**What is the structure of the settings?**

```
"settings":{
  "[COLLECTION-NAME]": {
    "[SCHEMATIC-NAME]": {
      "alias": "[ALIAS]",
      "[PROPERTY-NAME]": [VALUE]
    }
  }
}
```

For example:

```json
{
  "settings":{
    "@schematics/angular": {
      "component": {
        "alias": "components",
        "standalone": true
      }
    }
  }
}
```

##### **Projects**
Projects have all the projects created, but if you define someone that is not created, the schematic will create it.
All the settings of every project are read from the angular.json
**Project structure**
```
{
  "[PROJECT-NAME]":{
    "type": "library | application",
    "settings": "something like global settings",
    ...project structures like folders or schematics.
  }
}
```

```json
{
  "projects": {
    "project-demo": {
      "type": "application",
      "settings": {
        "@schematics/angular": {
          "component": {
            "style": "scss"
          }
        }
      },
      "src": {
        "type": "folder",
        "app": {
          "type": "folder"
        },
        "assets": {
          "type": "folder"
        }
      }
    }
  }
}
```
#### **Level 3**
##### Folder or Schematic?
Inside every project, you will have two types of objects: 
1. Schematic
2. Folder

To differentiate between folders and schematics, you need to define the type.
For example,

```json
{
  "components": {
    "type": "schematic"
  },
  "assets": {
    "type": "folder"
  }
}
```

**Schematics**
The properties that schematic object has are:
The object is a key/value pair. You have two options for the key:
1. Use an alias declare on global settings or project settings.
2. Define the schematic with this pattern: [COLLECTION-NAME]:[SCHEMATIC-NAME].

| Property name | Description                                             | optional |
|---------------|---------------------------------------------------------|----------|
| type          |                                                         | false    |
| settings      | All the setting of this schematic                       | true     |
| instances     | Execute many times with the same schematic base on name | true     |

```json
{
  "components": {
    "type": "schematic",
    "settings": {
      "prefix": "core"
    },
    "instances": {
      "home": {},
      "footer": {},
      "header": {}
    }
  },
  "@danils/schematicskit:prettier": {
    "type": "schematic"
  }
}
```

**Folders**
Inside folder objects yoy can have another folder or schematics object.

```json
{
  "assets": {
    "type": "folder",
    "scss": {
      "type": "folder"
    }
  }
}
```

### Priority of settings in different levels.
The priority of settings is: <code> **instances** > **schematic** > **project** > **global** </code>
You can set some properties of the settings and mix them together. But if you put some property on global will be re-write in project settings. 
