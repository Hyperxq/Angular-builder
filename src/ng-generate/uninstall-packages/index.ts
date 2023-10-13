import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { execSync } from 'child_process';
import { Spinner } from '../../utils/spinner';
import { colors } from '../../utils/color';

export function uninstallPackages(options: {
  packages: { packageName: string; version: string }[];
}): Rule {
  const { packages } = options;
  const ignores: string[] = ['@schematics/angular'];
  return (_tree: Tree, _context: SchematicContext) => {
    let spinner;
    try {
      for (const { packageName } of packages) {
        if (ignores.some((ignore) => ignore === packageName)) continue;
        spinner = new Spinner();
        spinner.start(`Uninstalling ${colors.blue(packageName)}`);
        execSync(`npm uninstall ${packageName}`, { stdio: 'inherit' });
        spinner.succeed(`${colors.green(packageName)} uninstalled`);
      }
    } catch (err) {
      spinner?.stop();
      throw err;
    }
  };
}
