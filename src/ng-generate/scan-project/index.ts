import { DirEntry, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProjectsIterator, ProjectDefinition, readWorkspace } from '../../utils';
import { JsonValue } from '@angular-devkit/core/src/json';

const SCHEMA_JSON = './node_modules/@danils/schematicskit/lib/schematics/config/schema.json';

export function scan(): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const json: any = {
      $schema: SCHEMA_JSON,
      settings: getSettings(),
      projects: await getProjectsStructures(tree, context),
    };
    const jsonContent = JSON.stringify(json, null, 2);
    if (tree.exists('./project-structure.json')) {
      tree.overwrite('./project-structure.json', jsonContent);
    } else {
      tree.create('./project-structure.json', jsonContent);
    }
    return () => tree;
  };
}

async function getProjectsStructures(tree: Tree, context: SchematicContext) {
  const response: { [key: string]: unknown } = {};
  const projects = Object.entries(await getProjectsPaths(tree));

  projects.forEach(([key, project]) => {
    const root = tree.getDir(project.root);
    const allDirectories = getDirectoriesRecursively(root);
    response[key] = {
      type: project.extensions.projectType,
      settings: getProjectSettings(project.extensions.schematics, context),
      ...generateNestedStructureFromDirectories(allDirectories, project.root),
    };
  });
  return response;
}

function getProjectSettings(schematics: JsonValue | undefined, _context: SchematicContext): {} {
  if (!schematics && typeof schematics !== 'object') return {};

  const settings: { [key: string]: {} } = {};

  const items = Object.entries(schematics as { [key: string]: { [key: string]: string } });
  items.forEach(([key, setting]) => {
    const [collection, schematicName] = key.split(':', 2);
    settings[collection] = {
      [schematicName]: setting,
    };
  });
  return settings;
}

async function getProjectsPaths(tree: Tree) {
  const workspace = await readWorkspace(tree);
  const projects = getProjectsIterator(workspace);
  const projectsInfo: { [key: string]: ProjectDefinition } = {};
  for (const [string, projectDefinition] of projects) {
    projectsInfo[string] = projectDefinition;
  }
  return projectsInfo;
}

function getSettings(): { [key: string]: {} } {
  return {
    '@schematics/angular': {
      component: {
        alias: 'components',
      },
      service: {
        alias: 'services',
      },
      module: {
        alias: 'modules',
      },
      directive: {
        alias: 'directives',
      },
      pipe: {
        alias: 'pipes',
      },
      class: {
        alias: 'classes',
      },
    },
  };
}

function getDirectoriesRecursively(
  dir: DirEntry,
  ignore: string[] = [
    '.idea',
    'node_modules',
    '.angular',
    'dist',
    '.git',
    '.vscode',
    'docs',
    'projects',
  ]
): string[] {
  let directories: string[] = [];

  for (const subDir of dir.subdirs) {
    if (ignore.includes(subDir)) {
      continue;
    }
    const path = dir.path + '/' + subDir;
    directories.push(path.replace('//', '/'));
    const childDir = dir.dir(subDir);
    directories = directories.concat(getDirectoriesRecursively(childDir, ignore));
  }

  return directories;
}

function generateNestedStructureFromDirectories(
  directories: string[],
  basePath: string
): { [key: string]: {} } {
  const structure: { [key: string]: {} } = {};

  directories.forEach((directory) => {
    const segments = directory
      .replace(basePath, '')
      .split('/')
      .filter((segment) => segment); // filter out empty segments
    let currentLevel = structure;

    segments.forEach((segment) => {
      if (!currentLevel[segment]) {
        currentLevel[segment] = {
          type: 'folder',
        };
      }
      currentLevel = currentLevel[segment];
    });
  });

  return structure;
}
