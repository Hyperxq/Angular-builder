import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export default function (): Rule {
  return (_host: Tree, context: SchematicContext) => {
    context.logger.log('info', `You can use these schematics in your project, only copy the name`);
    context.logger.log('info', `✨-   scan  (alias: s)`);
    context.logger.log('info', `✨-   build  (alias: b)`);
    return chain([]);
  };
}
