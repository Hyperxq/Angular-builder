interface Options {
  name: string; // Required, from "required" field in schema
  newProjectRoot?: string; // Optional, not in "required" field
  version: string; // Required, from "required" field in schema
  minimal?: boolean; // Optional, default value available
  strict?: boolean; // Optional, default value available
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'cnpm'; // Optional, enumerated string type
}
