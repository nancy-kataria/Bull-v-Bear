// Type declarations for CSS imports (side-effect and modules)
// Keeps TypeScript from erroring on `import "./globals.css"` side-effect imports.

declare module "*.css" {
  const content: { [className: string]: string } | string;
  export default content;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const content: { [className: string]: string } | string;
  export default content;
}

declare module "*.sass" {
  const content: { [className: string]: string } | string;
  export default content;
}
