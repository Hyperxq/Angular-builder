import { green, cyan, bold } from 'ansi-colors';
import { askChoices, askConfirmation } from '../../utils/prompt';

export interface BuildQuestions {
  allowInstallCollections: boolean;
  allowUnInstallCollections: boolean;
  collections: string[];
  addToAngularJson: boolean;
}

export async function installCollectionQuestion(): Promise<boolean> {
  const message = bold(
    green('Do you want to install the collections if they are not already installed?'),
  );
  return await askConfirmation(message, true);
}

export async function addCollectionsQuestion(
  collections: { packageName: string; version?: string }[],
): Promise<{ packageName: string; version?: string }[]> {
  const message = bold(green('Choose what collections you would like to install'));
  const choices = collections.map((collection) => ({
    name: cyan(collection.packageName),
    value: collection,
  }));
  return (
    (await askChoices<{ packageName: string; version?: string }>(message, choices, collections)) ??
    []
  );
}

export async function unInstallCollectionQuestion(): Promise<boolean> {
  const message = bold(
    green('Do you want to uninstall the collections after the process has finished?'),
  );
  return await askConfirmation(message, false);
}
