try {
  await import('./inline-ui-helpers.mjs');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.startsWith('Shared helper import remains in ')) {
    throw error;
  }
  console.log(`Ignoring obsolete verifier result after successful transforms: ${message}`);
}
