import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { execSync } from 'child_process';
import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { BuildOptions } from '../build/build.interfaces';
export function main(options: BuildOptions): Rule {
  return async () => {
    try {
      // execSync(`cd ./${dasherize(options.name)} && ng g @danils/angular-builder:build`, {
      //   stdio: 'inherit',
      // });
      const { name, workspaceStructure, ...buildOptions } = options;
      const commands = Object.entries(buildOptions)
        .map(([key, value]) => `--${dasherize(key)}=${value}`)
        .join(' ');

      const jsonString = JSON.stringify(workspaceStructure);
      const base64String = Buffer.from(jsonString).toString('base64');
      execSync(
        'ng add @danils/angular-builder --registry http://localhost:4873 --skip-confirmation',
        { stdio: 'inherit' },
      );
      execSync(
        `cd ./${dasherize(
          options.name!,
        )} &&  ng g @danils/angular-builder:build --base64-string=${base64String} ${commands} --dry-run=false`,
        {
          stdio: 'inherit',
        },
      );
      // execSync(
      //   `cd ./${dasherize(
      //     options.name!,
      //   )} && schematics ../../Angular-builder/src/collection.json:build --base64-string=${base64String} ${commands} --dry-run=false`,
      //   {
      //     stdio: 'inherit',
      //   },
      // );
    } catch (err) {
      throw new SchematicsException(
        `Something happened when trying to execute Build schematic: ${err.message}`,
      );
    }
  };
}
