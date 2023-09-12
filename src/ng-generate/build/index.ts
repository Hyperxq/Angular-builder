import {chain, Rule, SchematicContext, SchematicsException, Tree,} from '@angular-devkit/schematics';
import {
  FolderStructure,
  IParentSettings,
  IProjects,
  ISchematic,
  ISchematicParentsSettings,
  ISchematicSettings,
  SchematicStructure,
  Structure,
  WorkspaceStructure,
} from './build.interfaces';
import {RunSchematicTask} from '@angular-devkit/schematics/tasks';
import {getJsonFile, getProject, readWorkspace} from "../../utils";
import {TaskId} from "@angular-devkit/schematics/src/engine/interface";

export function executeWorkspaceSchematics(): Rule {
  // { customFilePath }: { customFilePath: string }
  return async (tree: Tree, _context: SchematicContext) => {

    const { $schema, settings, projects, ...schematics } = getJsonFile<WorkspaceStructure>(
      tree,
      './project-structure.json'
    );

    if(!$schema) {
      throw new SchematicsException('$schema property is required');
    }

    const parentTaskIds: TaskId[] =  await ensureProjectExists(projects as IProjects, tree, _context);
    executeGlobalSchematicRules(_context, schematics,parentTaskIds, settings ?? {});
    await processProjects(_context, projects, settings, tree, parentTaskIds);
    return chain([]);
  };
}

async function ensureProjectExists(projects: IProjects, tree: Tree, context: SchematicContext) {
  const workspace = await readWorkspace(tree);
  const projectNames = Object.keys(projects);
  context.logger.log('info', projectNames.toString());
  let taskIds: TaskId[] = [];
  for (const projectName of projectNames) {
    let project = getProject(workspace, projectName);
    if (!project) {
      const { type } = projects[projectName];

      if (!type) {
        throw new SchematicsException('Type is needed for every project');
      }
      context.logger.info(`Project ${projectName} does not exist, creating...`);
      taskIds.push(context.addTask(new RunSchematicTask('@schematics/angular', type, { name: projectName })));
    }
  }
  context.logger.log('info', `Parents taskIds: ${taskIds.join(', ')}`);
  return taskIds;
}

async function processProjects(
  _context: SchematicContext,
  projects: {
    [p: string]: {
      [p: string]: {
        [p: string]: any;
      };
    };
  },
  settings: {
    [key: string]: {
      [prop: string]: {
        alias: string;
      } & {
        [prop: string]: any;
      };
    };
  },
  tree: Tree,
  parentTasks: TaskId[]
) {
  const taskIds: TaskId[] = [];

  const workspace = await readWorkspace(tree);
  const projectKeys = Object.keys(projects);
  projectKeys.forEach((projectName) => {
    let project = getProject(workspace, projectName);
    const path = project?.root ?? `${workspace.extensions.newProjectRoot}/${projectName}`;
    const { type, settings: projectSettings, ...structures } = projects[projectName];
    Object.entries(structures)
      .map<Structure>((structure) => ({ [structure[0]]: structure[1] } as Structure))
      .forEach((structure: Structure) => {
        taskIds.push(
            ...processStructure(
                path,
                {
                  globalSettings: settings ?? {},
                  projectSettings: projectSettings ?? {},
                },
                structure,
                parentTasks,
                _context
            )
        );
      });
  });
  return taskIds;
}

/**
 * Retrieves the last occurrence of schematic settings based on the provided alias.
 *
 * @param _context - The schematic context.
 * @param alias - The alias to search for.
 * @param settings - The collections of schematics' settings.
 * @returns The schematic settings if found, otherwise undefined.
 */
function getSchematicSettingsByAlias(
  _context: SchematicContext,
  alias: string,
  settings?: //collections
  {
    //schematics
    [key: string]: {
      [prop: string]: {
        alias: string;
      } & {
        [prop: string]: any;
      };
    };
  }
): ISchematicSettings | undefined {
  if (!settings || Object.keys(settings).length === 0) return undefined;
  //TODO: refactor this.
  let schematicSetting: ISchematicSettings;

  for (const [collection, schematicObject] of Object.entries(settings).reverse()) {
    for (const [schematicName, schematicDetails] of Object.entries(schematicObject).reverse()) {
      const { alias: schematicAlias, ...schematicSettings } = schematicDetails;
      if (schematicAlias === alias) {
        schematicSetting = {
          collection,
          schematicName,
          settings: schematicSettings,
        };
        return schematicSetting as ISchematicSettings;
      }
    }
  }

  return undefined;
}

function processStructure(
  path: string,
  parentsSettings: IParentSettings,
  structure: Structure,
  parentTaskIds: TaskId[] = [],
  _context: SchematicContext
) {
  const { type, ...content } = structure;
  const currentBranchTaskIds: TaskId[] = [];
  const schematics = extractStructures(
    content as FolderStructure | SchematicStructure,
    'schematic'
  );

  schematics.forEach((schematicName) => {
    currentBranchTaskIds.push(
      ...processSchematic(_context, schematicName, content[schematicName], parentsSettings, parentTaskIds, path)
    );
  });

  const folderNames = extractStructures(content as FolderStructure | SchematicStructure, 'folder');

  folderNames.forEach((folderName) => {
    // parentTaskIds.push(
    //   ...
    // );
    processStructure(
        `${path}/${folderName}`,
        parentsSettings,
        content[folderName] as Structure,
        [...currentBranchTaskIds, ...parentTaskIds],
        _context
    )
  });

  return parentTaskIds;
}

function processSchematic(
  _context: SchematicContext,
  schematicName: string,
  structure: SchematicStructure,
  parentsSettings: IParentSettings,
  parentTaskIds: TaskId[] = [],
  path: string
) {
  const globalSettings = getSchematicSettingsByAlias(
    _context,
    schematicName,
    parentsSettings.globalSettings
  );

  const projectSettings = getSchematicSettingsByAlias(
    _context,
    schematicName,
    parentsSettings.projectSettings
  );

  const { instances, settings } = structure;

  const [collectionName, schematic] = schematicName.split(':', 2);
  return executeExternalSchematicRules(
    { globalSettings, projectSettings },
    {
      collection:
        collectionName && schematic
          ? collectionName
          : globalSettings?.collection ?? projectSettings?.collection,
      schematicName:
        schematic ??
        globalSettings?.schematicName ??
        projectSettings?.schematicName ??
        schematicName,
      instances,
      settings: settings
    },
    path,
    _context,
    parentTaskIds
  );
}

function extractStructures(
  content: FolderStructure | SchematicStructure,
  type: 'schematic' | 'folder'
): string[] {
  return Object.keys(content).filter(
    (key) => (content[key] as FolderStructure | SchematicStructure).type === type
  );
}

function executeGlobalSchematicRules(
  _context: SchematicContext,
  schematics: {
    [key: string]: {
      [prop: string]: any;
    };
  },
  parentTaskIds: TaskId[] = [],
  globalSettings?: {
    [key: string]: {
      [prop: string]: any;
    };
  },

): TaskId[] {
  const taskIds: TaskId[] = [];
  for (const [schematicName, content] of Object.entries(schematics)) {
    taskIds.push(...processSchematic(
        _context,
        schematicName,
        content as SchematicStructure,
        { globalSettings },
        parentTaskIds,
        '/'
    ))
  }
  return taskIds;
}

/**
 * Executes external schematic rules based on the provided settings and schematic details.
 *
 * @param parentsSettings - The parent settings filtered by the schematic and collection needed.
 * @param schematic - The schematic details.
 * @param path - The path where the schematic should be executed.
 * @param _context - The schematic context.
 * @param parentTaskIds
 * @returns An array of rules to be executed.
 */
function executeExternalSchematicRules(
  parentsSettings: ISchematicParentsSettings,
  schematic: ISchematic,
  path: string,
  _context: SchematicContext,
  parentTaskIds: TaskId[]
): TaskId[] {
  const taskIds: TaskId[] = [];

  // Merge settings from various sources
  const settings = {
    ...schematic.settings,
    ...(parentsSettings.projectSettings?.settings ?? {}),
    ...(parentsSettings.globalSettings?.settings ?? {}),
  };

  // Validate schematic details
  if (!schematic.collection) {
    throw new SchematicsException('Collection is not defined in the schematic.');
  }
  if (!schematic.schematicName) {
    throw new SchematicsException('Schematic name is not defined in the schematic.');
  }

  if (!schematic.instances) {
    taskIds.push(createExternalSchematicCall(schematic, path, settings, _context, parentTaskIds));
  } else {
    for (const [name, instanceSettings] of Object.entries(schematic.instances)) {
      taskIds.push(
        createExternalSchematicCall(schematic, path, { ...settings, ...instanceSettings }, _context, parentTaskIds, name)
      );
    }
  }

  return taskIds;
}

/**
 * Creates an external schematic call with the provided settings and options.
 *
 * @param schematic - The schematic details.
 * @param path - The path where the schematic should be executed.
 * @param settings - The merged settings.
 * @param context
 * @param parentTaskIds
 * @param name - The name of the instance (optional).
 * @returns A rule representing the external schematic call.
 */
function createExternalSchematicCall(
  schematic: ISchematic,
  path: string,
  settings: {
    [key: string]: any;
  },
  context: SchematicContext,
  parentTaskIds: TaskId[],
  name?: string,
): TaskId {
  context.logger.info(`Task ids: ${parentTaskIds.join(", ")}`);
  return context.addTask(new RunSchematicTask(schematic.collection!, schematic.schematicName!, {
    path,
    ...settings,
    ...(name ? { name } : {}),
  }), parentTaskIds);
}
