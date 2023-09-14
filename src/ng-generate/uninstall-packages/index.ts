import {Rule, SchematicContext, Tree} from "@angular-devkit/schematics";
import {execSync} from "child_process";

export function uninstallPackages(options: {packages: {packageName: string; version: string}[]}): Rule {
    const {packages} = options;
    const ignores: string[] = ['@schematics/angular'];
    return (_tree: Tree, _context: SchematicContext) => {
        for (const {packageName} of packages) {
            if(ignores.some(ignore => ignore === packageName)) continue;
            _context.logger.info(`Uninstalling ${packageName}`);
            execSync(`npm uninstall ${packageName}`,  { stdio: 'inherit' });
        }
    };
}