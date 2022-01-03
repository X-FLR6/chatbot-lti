import { Database } from "./Database";
import { IdToken } from "./IdToken";
import { Platform } from "./Platform";

export interface LineItemOptions {
  resourceLinkId?: boolean;
  resourceId?: boolean | false;
  tag?: string | false;
  limit?: number | false;
  id?: number | false;
  label?: string | false;
  url?: string | false;
}

export type UpdateLineItemAttributes = Omit<CreateLineItemOptions, "tag">;

export interface CreateLineItemOptions {
  userId: string;
  scoreGiven: number;
  scoreMaximum?: number;
  label?: string;
  tag?: string;
  comment: string;
  activityProgress?: string;
  gradingProgress?: string;
  startDateTime?: string;
  endDateTime?: string;
}

export interface LineItem extends CreateLineItemOptions {
  id: string;
}

export class GradeService {
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
  getLineItems(
    idToken: IdToken,
    options?: LineItemOptions,
    accessToken?: string
  ): Promise<LineItem[] | false>;
  createLineItem(
    idToken: IdToken,
    lineItem: CreateLineItemOptions,
    options: { resourceLinkId: boolean },
    accessToken: string
  ): Promise<LineItem>;
  getLineItemById(
    idToken: IdToken,
    lineItemId: string,
    accessToken: string
  ): Promise<LineItem>;
  updateLineItemById(
    idToken: IdToken,
    lineItemId: string,
    lineItem: CreateLineItemOptions
  ): Promise<LineItem>;
}
