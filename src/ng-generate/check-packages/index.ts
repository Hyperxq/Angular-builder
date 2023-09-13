import {Rule, SchematicContext, Tree} from "@angular-devkit/schematics";
import {execSync} from "child_process";
import {getPackageJsonDependency} from "../../utils/dependencies";

export function checkPackages(options: {packages: {packageName: string; version: string}[]}): Rule {
    const {packages} = options;
    return (tree: Tree, _context: SchematicContext) => {
        _context.logger.info(`Checking ${JSON.stringify(packages)}`);
        for (const {packageName, version} of packages) {
            const packageNameVersion = packageName + `${version? `@${version}`: ''}`;
            const packageDep = getPackageJsonDependency(tree, packageName);
            if(!packageDep)execSync(`ng add ${packageNameVersion} --skip-confirmation`,  { stdio: 'inherit' });
        }
    };
}