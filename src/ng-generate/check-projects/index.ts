import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Spinner } from '../../utils/spinner';
import { colors } from '../../utils/color';
import { getProject, WorkspaceDefinition } from '../../utils';
import { RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { IProjects } from '../build/build.interfaces';
import { TaskId } from '@angular-devkit/schematics/src/engine/interface';

export function checkProjects(options: {
  projects: IProjects;
  workspace: WorkspaceDefinition;
  projectNames: string[];
  parentTasks: TaskId[];
}): Rule {
  const { workspace, projectNames, projects, parentTasks } = options;
  return (_tree: Tree, context: SchematicContext) => {
    let spinner = new Spinner();
    try {
      for (const projectName of projectNames) {
        spinner.start(`Checking ${colors.bgBlue(projectName)} project...`);
        const project = getProject(workspace, projectName);
        if (!project) {
          spinner.info(`Creating ${colors.bgMagenta(projectName)} as a project`);
          const { type } = projects[projectName];

          if (!type) {
            throw new SchematicsException('Type is needed for every project');
          }

          context.addTask(
            new RunSchematicTask('@schematics/angular', type, {
              name: projectName,
              skipPackageJson: true,
            }),
            parentTasks,
          );
          spinner.succeed(`${colors.bgMagenta(projectName)} project was created`);
        }
      }
    } catch (err) {
      spinner?.stop();
      throw err;
    }
  };
}
