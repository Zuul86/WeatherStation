export class UpdateTemperatureUnit {
    static readonly type = '[Temperature Unit] Update Temperature Unit';
    constructor(public unit: string) {}
}