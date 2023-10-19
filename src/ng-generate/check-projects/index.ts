import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Spinner } from '../../utils/spinner';
import { colors } from '../../utils/color';
import { getProject, readWorkspace, WorkspaceDefinition } from '../../utils';
import { RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { IProjects } from '../build/build.interfaces';
import { TaskId } from '@angular-devkit/schematics/src/engine/interface';

export function checkProjects(options: {
  projects: IProjects;
  workspace: WorkspaceDefinition;
  projectNames: string[];
  parentTasks: TaskId[];
}): Rule {
  const { projectNames, projects, parentTasks } = options;
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(tree);
    let spinner = new Spinner();
    try {
      for (const projectName of projectNames) {
        spinner.start(`Checking ${colors.bgBlue(projectName)} project.`);
        const project = getProject(workspace, projectName);
        if (!project) {
          spinner.info(`Creating ${colors.bgMagenta(projectName)} as a project`);
          const { type: projectType, projectOptions } = projects[projectName];

          if (!projectType && (projectType === 'library' || projectType === 'application')) {
            throw new SchematicsException(
              `Type is needed for every project. The type only can be 'library' or 'application'`,
            );
          }

          context.addTask(
            new RunSchematicTask('@schematics/angular', projectType, {
              name: projectName,
              skipPackageJson: true,
              ...(projectOptions ?? {}),
            }),
            parentTasks,
          );
          spinner.succeed(`${colors.bgMagenta(projectName)} project was created`);
        } else {
          spinner.stop();
        }
      }
    } catch (err) {
      spinner?.stop();
      throw err;
    }
  };
}
