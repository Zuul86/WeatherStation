export class UpdateTemperatureUnit {
    static readonly type = '[Settings Menu] Update Temperature Unit';
    constructor(public unit: string) { }
}