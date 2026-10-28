export interface CallProvider {
  readonly enabled: boolean;
  placeCall(_to: string, _metadata: Record<string, unknown>): Promise<never>;
}

export class NotImplementedProvider implements CallProvider {
  readonly enabled = false;

  async placeCall(_to: string, _metadata: Record<string, unknown>): Promise<never> {
    void _to;
    void _metadata;
    throw new Error(
      "Live outbound calling is disabled until CallKaro documentation is verified and approved.",
    );
  }
}
