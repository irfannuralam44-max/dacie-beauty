export async function register() {
  const mode = process.env.APP_MODE;
  if (mode !== "public" && mode !== "private") {
    throw new Error(
      "APP_MODE must be set to 'public' or 'private' before starting the application."
    );
  }
}