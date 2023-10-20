import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { execSync } from 'child_process';

export function main(options: Options): Rule {
  return async () => {
    try {
      const commands = Object.entries(options)
        .map(([key, value]) => `--${key} ${value}`)
        .join(' ');
      execSync(`ng new ${commands}`, { stdio: 'inherit' });
    } catch (err) {
      throw new SchematicsException(
        `Something happened when trying to create a new workspace: ${err.message}`,
      );
    }
  };
}
