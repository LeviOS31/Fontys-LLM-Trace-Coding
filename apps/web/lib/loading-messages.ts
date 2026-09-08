const LOADING_MESSAGES = [
  "Initializing interactive environment...",
  "Preparing analytical workspace...",
  "Finalizing client-side state...",
  "Optimizing interface rendering...",
  "Establishing interactive session...",
  "Preparing axial code analysis...",
  "Loading trace visualization data...",
  "Mapping code relationships...",
  "Initializing analytical framework...",
  "Compiling research metrics...",
  "Validating component state...",
  "Synchronizing server and client state...",
  "Preparing data binding layer...",
  "Optimizing query performance...",
  "Aligning rendering layers...",
] as const;

export function getRandomLoadingMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}
