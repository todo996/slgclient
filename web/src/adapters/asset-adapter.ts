export class AssetAdapter {
  constructor(private readonly baseUrl = "/game-assets") {}

  async json<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(this.resolve(path), { signal });

    if (!response.ok) {
      throw new Error(
        `Không tải được JSON ${path}: HTTP ${response.status}`,
      );
    }

    return response.json() as Promise<T>;
  }

  image(path: string): string {
    return this.resolve(path);
  }

  audio(path: string): string {
    return this.resolve(path);
  }

  private resolve(path: string): string {
    const normalizedPath = path.replace(/^\/+/, "");
    return `${this.baseUrl.replace(/\/$/, "")}/${normalizedPath}`;
  }
}
