import { Database } from "./Database";
import { IdToken } from "./IdToken";
import { Platform } from "./Platform";

export interface DeepLinkingMessageOptions {
  message?: string | undefined;
  errMessage?: string | undefined;
  log?: string | undefined;
  errLog?: string | undefined;
}

export interface ContentItem {
  type: string;
  title: string;
  url?: string | undefined;
  custom?: unknown;
}

export class DeepLinkingService {
  constructor(
    getPlatform: (
      url: string,
      clientId?: string,
      ENCRYPTIONKEY?: string,
      database?: Database
    ) => Promise<Platform[] | Platform | false>,
    ENCRYPTIONKEY?: string,
    database?: Database
  );

  createDeepLinkingForm(
    idToken: IdToken,
    contentItems: ContentItem[],
    options: DeepLinkingMessageOptions
  ): Promise<string | false>;

  createDeepLinkingMessage(
    idToken: IdToken,
    contentItems: ContentItem[],
    options: DeepLinkingMessageOptions
  ): Promise<string | false>;
}
