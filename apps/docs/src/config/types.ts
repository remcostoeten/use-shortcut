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

export interface ComponentRecipeShortcut {
  label: string;
  combo: string;
}

export interface ComponentRecipe {
  id: string;
  title: string;
  summary: string;
  description?: string;
  code: string;
  language?: string;
  previewId?: string;
  shortcuts?: ComponentRecipeShortcut[];
  notes?: string[];
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

export interface PackageConfig {
  slug: string;
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

  links: {
    npm: string;
    github: string;
    docs?: string;
    demo?: string;
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
  componentRecipes?: ComponentRecipe[];
  codeExamples?: CodeExample[];
  uiUseCases?: UiUseCase[];
  useCases?: string;
}
