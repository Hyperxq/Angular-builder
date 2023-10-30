import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { execSync } from 'child_process';
import { getPackageJsonDependency } from '../../utils/dependencies';
import { Spinner } from '../../utils/spinner';
import { colors } from '../../utils/color';

export function checkPackages(options: {
  packages: { packageName: string; version: string }[];
}): Rule {
  const ignores: string[] = ['@schematics/angular'];
  const { packages } = options;
  return (tree: Tree, _context: SchematicContext) => {
    let spinner = new Spinner();
    try {
      console.log(colors.green('Checking collections...'));
      for (const { packageName, version } of packages) {
        if (ignores.some((ignore) => ignore === packageName)) continue;
        spinner = new Spinner();
        spinner.start(`Checking if ${colors.blue(packageName)} are install...`);
        const packageNameVersion = packageName + `${version ? `@${version}` : ''}`;
        const packageDep = getPackageJsonDependency(tree, packageName);
        if (!packageDep) {
          execSync(`ng add ${packageNameVersion} --skip-confirmation`, { stdio: 'inherit' });
          spinner.succeed(`${colors.green(packageName)} was installed successfully`);
        } else {
          spinner.info(`${colors.green(packageName)} are already installed`);
          spinner.stop();
        }
      }
    } catch (err) {
      spinner?.stop();
      throw err;
    }
  };
}
