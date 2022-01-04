declare module "ltijs" {
  import { Express, NextFunction, Request, Response } from "express";

  import { Database, DatabaseOptions } from "./Database";
  import { Platform, PlatformConfig } from "./Platform";
  import { GradeService } from "./Grade";
  import { DeepLinkingService } from "./DeepLinking";
  import { NamesAndRolesService } from "./NamesAndRoles";

  export class ProviderService {
    app: Express;
    Grade: GradeService;
    NamesAndRoles: NamesAndRolesService;
    DeepLinking: DeepLinkingService;
    setup(
      encryptionkey: string,
      database: DatabaseOptions,
      options: ProviderOptions
    ): Provider;
    deploy(options?: DeploymentOptions): Promise<true | undefined>;
    close(options?: {
      silent?: boolean | undefined;
    }): Promise<true | undefined>;
    onConnect(
      _connectCallback: OnConnectCallback,
      options?: OnConnectOptions
    ): true;
    onDeepLinking(
      _connectCallback: OnConnectCallback,
      options?: OnConnectOptions
    ): true;
    onDynamicRegistration(
      _dynamicRegistrationCallback: CallbackTypeOne
    ): boolean;
    onSessionTimeout(_sessionTimeoutCallback: CallbackTypeTwo): boolean;
    onInvalidToken(_invalidTokenCallback: CallbackTypeTwo): boolean;
    onUnregisteredPlatform(
      _unregisteredPlatformCallback: CallbackTypeTwo
    ): boolean;
    onInactivePlatform(_inactivePlatformCallback: CallbackTypeTwo): boolean;

    appRoute(): string;
    keysetRoute(): string;
    dynRegRoute(): string;
    loginRoute(): string;

    whitelist(...routes: (string | RegExp)[]): string[];

    registerPlatform(_platform: PlatformConfig): Promise<Platform>;
    getPlatform(
      url: string,
      clientId?: string,
      ENCRYPTIONKEY?: string,
      database?: Database
    ): Promise<Platform[] | Platform | false>;
    getPlatformById(platformId: string): Promise<Platform | false>;
    updatePlatformById(
      platformId: string,
      platformInfo: PlatformConfig
    ): Promise<Platform | false>;
    deletePlatform(url: string, clientId: string): Promise<boolean>;
    deletePlatformById(platformId: string): Promise<boolean>;
    getAllPlatforms(): Promise<Platform[]>;
    redirect(response: Response, path: string, options?: RedirectOptions): void;

    loginUrl(): string;
    appUrl(): string;
    keysetUrl(): string;
  }

  export interface ServerAddonFunction {
    (app: Express): void;
  }

  export interface ProviderOptions {
    appRoute?: string | undefined;
    loginRoute?: string | undefined;
    keysetRoute?: string | undefined;
    dynRegRoute?: string | undefined;
    https?: boolean | undefined;
    ssl?:
      | {
          key: string;
          cert: string;
        }
      | undefined;
    staticPath?: string | undefined;
    cors?: boolean | undefined;
    serverAddon?: (() => void) | undefined;
    cookies?:
      | {
          secure?: boolean | undefined;
          sameSite?: string | undefined;
          domain?: string | undefined;
        }
      | undefined;
    devMode: boolean;
    tokenMaxAge?: number;
    dynReg?: {
      url: string;
      name: string;
      logo: string;
      description: string;
      redirectUris: string[];
      customParameters: unknown;
      autoActivate: boolean;
    };
  }

  export interface DeploymentOptions {
    port?: number | undefined;
    silent?: boolean | undefined;
    serverless?: boolean | undefined;
  }

  export interface OnConnectCallback {
    (
      connection: IdToken,
      request: Request,
      response: Response,
      next: NextFunction
    ): Response | void | Promise<Response | void>;
  }
  export interface OnConnectOptions {
    sessionTimeout?:
      | ((request: Request, response: Response) => Response)
      | undefined;
    invalidToken?:
      | ((request: Request, response: Response) => Response)
      | undefined;
    secure?: boolean | undefined;
    sameSite?: string;
  }

  export interface CallbackTypeOne {
    (request: Request, response: Response, next: NextFunction):
      | Response
      | void
      | Promise<Response | void>;
  }

  export interface CallbackTypeTwo {
    (request: Request, response: Response):
      | Response
      | void
      | Promise<Response | void>;
  }

  export interface RedirectOptions {
    newResource?: boolean | undefined;
    query?: object | undefined;
  }

  export const Provider = new ProviderService();
  export { IdToken };
}
