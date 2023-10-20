import axios from 'axios';
import { RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { chain, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { TaskId } from '@angular-devkit/schematics/src/engine/interface';
import { BuildOptions, WorkspaceStructure } from '../build/build.interfaces';

export function main(options: Options) {
  return async (_tree: Tree, context: SchematicContext) => {
    // Is it the json will have the workspace options?
    //1. Create workspace.
    // @ts-ignore
    const workspaceId: TaskId = context.addTask(
      new RunSchematicTask('create-angular-workspace', options),
    );
    //2. Read JSON remote file.

    const workspaceStructure = await fetchData<WorkspaceStructure>();
    // @ts-ignore
    const buildOptions: BuildOptions = {
      workspaceStructure,
      installCollection: true,
      addCollections: true,
      name: options.name,
    };
    //3. Execute build schematic.
    // @ts-ignore
    const buildId: TaskId = context.addTask(
      new RunSchematicTask('call-build-schematic', buildOptions),
      [workspaceId],
    );
    // context.addTask(
    //   new NodePackageInstallTask({
    //     packageName: '@danils/angular-builder',
    //   }),
    // );
    return chain([]);
  };
}

// @ts-ignore
async function fetchData<T>(): Promise<T> {
  try {
    const { data } = await axios.get(
      'http://localhost:3000/schemas/json?id=aa6539bd-efef-4bc7-a668-b538f557d6ed',
    );
    return data as T;
  } catch (error) {
    throw new SchematicsException(`Error fetching data: ${error.message}`);
  }
}
