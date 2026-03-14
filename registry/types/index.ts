export interface NavLink {
  label: string;
  url: string;
}

export interface Feature {
  value?: string;
  label: string;
  description: string;
}

export interface ApiProp {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ApiPropGuidance {
  prop: string;
  guidance: string;
  whenToUse?: string;
  example?: string;
  exampleLanguage?: string;
}

export interface ApiCapability {
  name: string;
  kind: "function" | "type" | "constant";
  summary: string;
  possible: string;
  example?: string;
  exampleLanguage?: string;
  result?: string;
  resultLanguage?: string;
}

export interface ApiMethod {
  name: string;
  signature: string;
  description: string;
}

export interface ApiMethodGroup {
  title: string;
  description?: string;
  methods: ApiMethod[];
}

export interface ApiOptionGroup {
  title: string;
  description?: string;
  options: ApiProp[];
  usageExample?: string;
  usageLanguage?: string;
}

export interface CodeExample {
  title: string;
  description?: string;
  code: string;
  language?: string;
}

export interface UiUseCaseAction {
  label: string;
  shortcut: string;
}

export interface UiUseCase {
  id: string;
  title: string;
  summary: string;
  whenToUse?: string;
  actions: UiUseCaseAction[];
  notes?: string[];
}

export interface Cta {
  label: string;
  url: string;
  primary?: boolean;
  shortcutKey?: string;
}

export type PackageKind = "package" | "extension" | "cli";

export interface InstallMethod {
  id: string;
  label: string;
  command: string;
  copyLabel?: string;
}

export interface InstallAsset {
  label: string;
  title: string;
  description: string;
  href: string;
}

export interface PackageConfig {
  slug: string;
  kind?: PackageKind;
  packageName: string;
  installName: string;
  tagline?: string;
  description: string;
  heroSubcopy?: string;
  heroTitle: string;
  bundleSizeKb?: number;

  author: {
    name: string;
    handle: string;
    url: string;
  };

  navLinks: NavLink[];

  install?: {
    heading?: string;
    description?: string;
    methods?: InstallMethod[];
    assets?: InstallAsset[];
  };

  links: {
    npm?: string;
    github: string;
    docs?: string;
    demo?: string;
    marketplace?: string;
  };

  ctas?: Cta[];

  why?: {
    paragraphs: string[];
  };

  features?: Feature[];
  apiProps?: ApiProp[];
  apiPropGuidance?: ApiPropGuidance[];
  apiCapabilities?: ApiCapability[];
  apiMethodGroups?: ApiMethodGroup[];
  apiOptionGroups?: ApiOptionGroup[];
  codeExamples?: CodeExample[];
  uiUseCases?: UiUseCase[];
  useCases?: string;
}

export type RegistryItemKind = "package" | "cli" | "extension";
export type RegistryItemStatus = "live" | "upcoming";

export interface RegistryItem {
  id: string;
  title: string;
  description: string;
  kind: RegistryItemKind;
  status: RegistryItemStatus;
  label: string;
  href?: string;
  docsUrl?: string;
  githubUrl?: string;
  npmPackageName?: string;
  tagline?: string;
}

export type DocsUrlResolver = (slug: string) => string;
export type PackagePathResolver = (slug: string) => string;
export type SiteUrlMatcher = (value: string) => boolean;

export interface RegistryBuildOptions {
  getPackageDocsUrl: DocsUrlResolver;
  getPackagePath: PackagePathResolver;
  isCurrentSiteUrl: SiteUrlMatcher;
}
