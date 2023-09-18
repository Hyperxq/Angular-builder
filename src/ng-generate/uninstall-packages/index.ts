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
    const spinnerMain = new Spinner();
    let spinner;
    try {
      spinnerMain.start('Uninstalling collections...');
      for (const { packageName } of packages) {
        if (ignores.some((ignore) => ignore === packageName)) continue;
        spinner = new Spinner();
        spinner.start(`Uninstalling ${colors.blue(packageName)}`);
        execSync(`npm uninstall ${packageName}`, { stdio: 'inherit' });
        spinner.succeed(`${colors.green(packageName)} uninstalled`);
      }
      spinnerMain.succeed(`Collections were ${colors.green('uninstalled')} successfully`);
    } catch (err) {
      spinner?.stop();
      spinnerMain.stop();
      throw err;
    }
  };
}
