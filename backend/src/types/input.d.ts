declare module 'input' {
    export function text(question: string, options?: any): Promise<string>;
    export function select(question: string, choices: string[], options?: any): Promise<string>;
    export function confirm(question: string, options?: any): Promise<boolean>;
}