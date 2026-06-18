export interface HomeAction {
  href: string;
  label: string;
  variant: 'primary' | 'secondary';
}

export interface HomeFeature {
  title: string;
  description: string;
}

export interface HomeNavLink {
  href: string;
  label: string;
}
