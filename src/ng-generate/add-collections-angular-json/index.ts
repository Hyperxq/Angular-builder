import { Rule } from '@angular-devkit/schematics';
import { updateWorkspace } from '../../utils';

export function AddCollectionsAngularJson(options: { packages: string[] }): Rule {
  const { packages } = options;
  return updateWorkspace((workspace) => {
    try {
      const { cli } = workspace.extensions;
      const collections = (cli as { schematicCollections?: string[] })?.schematicCollections ?? [];
      for (const packageName of packages) {
        if (!collections.some((c) => c === packageName)) collections.push(packageName);
      }

      if (!cli) workspace.extensions.cli = {};
      (workspace.extensions.cli as { schematicCollections?: string[] }).schematicCollections =
        collections;
    } catch (err) {
      throw err;
    }
  });
}
