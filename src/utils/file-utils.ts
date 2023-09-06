import {normalize} from '@angular-devkit/core';
import {WorkspaceDefinition} from '@angular-devkit/core/src/workspace';
import {
  Rule, SchematicsException, Tree,
} from '@angular-devkit/schematics';
import * as ts from 'typescript';
import {addImportToModule, isImported} from './ast-utils';
import {applyToUpdateRecorder} from './change';
import {ProjectDefinition, readWorkspace, TargetDefinition} from './workspace';

/**
 *  @param host - the Tree object of the project
 *  @param path - the url of your file
 *  @returns the file by url
 */
export function getSourceFile(host: Tree, path: string): ts.SourceFile {
  const buffer = host.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not find ${path}.`);
  }
  const content = buffer.toString();
  return ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
}

/**
 *  @param workspace
 *  @param projectName
 *  @returns the project by projectName
 */
export function getProject(
  workspace: WorkspaceDefinition,
  projectName: string
): ProjectDefinition | undefined {
  // const project = workspace.projects.get(projectName);
  // if (!project) {
  //   throw new SchematicsException(`The project ${projectName} doesn't exist`);
  // }
  // if (project.extensions.projectType !== 'application') {
  //   throw new SchematicsException(`It's required that the project type be a "application".`);
  // }
  return workspace.projects.get(projectName);
}

/**
 * To get the default project when the user doesn't define the project
 *  @param workspace
 *  @returns the default project
 */
export function getDefaultProjectName(workspace: WorkspaceDefinition): string {
  const projectName = workspace.projects.keys().next().value;
  if (!projectName) {
    throw new SchematicsException(`You don't have any project in your workspace`);
  }
  return projectName;
}

/**
 *To get the project's names from the workspace.
 *  @param workspace
 *  @returns the Project's name list.
 */
export function getProjectNames(workspace: WorkspaceDefinition): string[] {
  return Array.from(workspace.projects.entries(), ([key]) => key);
}

export function getProjectsIterator(workspace: WorkspaceDefinition) {
  return workspace.projects.entries();
}

/**
 *  @param project
 *  @returns the target definition
 */
export function getBuildTarget(project: ProjectDefinition): TargetDefinition {
  const buildTarget = project?.targets.get('build');
  if (!buildTarget) {
    throw new SchematicsException(`Project target "build" not found.`);
  }
  return buildTarget;
}

/**
 *  add an import to the imports section of a module, if you already has the import it'll be skipped.
 *  @param tree
 *  @param bootstrapModuleDestinyPath - the path of the destiny module, for example: 'src/app/app.module.ts'
 *  @param dependencyPath - the path of the import, for example: `'@angular/common/http'`
 *  @param dependencyName - the name of the import, for example: `HttpClientModule`
 *  @param addToMetadataField - when you don't want to add the import to the imports sections.
 */
export function addDependencyToModule(
  tree: Tree,
  bootstrapModuleDestinyPath: string,
  dependencyPath: string,
  dependencyName: string,
  addToMetadataField = true
): void {
  if (
    !isImported(getSourceFile(tree, bootstrapModuleDestinyPath), dependencyName, dependencyPath)
  ) {
    const changes = addImportToModule(
      getSourceFile(tree, bootstrapModuleDestinyPath),
      bootstrapModuleDestinyPath,
      dependencyName,
      dependencyPath,
      addToMetadataField
    );
    const recorder = tree.beginUpdate(bootstrapModuleDestinyPath);
    applyToUpdateRecorder(recorder, changes);
    tree.commitUpdate(recorder);
  }
}

/*
 * It creates a routing file for the folder structure
 * @param {FolderStructure} structure - FolderStructure
 * @param {ScaffoldOptions} options - FolderStructureOptions - this is the options object that
 * we pass to the schematic.
 * @returns A Rule
 */



export function createEmptyFolder(path: string): Rule {
  return (tree: Tree) => {
    if (!tree.exists(`${path}/.gitkeep`)) {
      tree.create(normalize(`${path}/.gitkeep`), '');
    }
    return tree;
  };
}

export function getJsonFile<T>(tree: Tree, path: string): T {
  const buffer = tree.read(path);
  if (!buffer) {
    throw new SchematicsException(`Could not find ${path}.`);
  }
  const content = buffer.toString();
  return JSON.parse(content);
}

export async function getClientBuild(tree: Tree, projectName: string) {
  const workspace = await readWorkspace(tree);
  const project = getProject(workspace, projectName);
  return getBuildTarget(project!);
}
